import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdImpressionData {
  ad_id: string
  ad_unit_id?: string
  user_id?: string
  session_id: string
  revenue_cents: number
  device_info?: Record<string, any>
  location_data?: Record<string, any>
}

interface AdClickData {
  impression_id: string
  click_revenue_cents: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (method) {
      case 'POST':
        if (action === 'impression') {
          return await handleImpression(req, supabaseClient)
        } else if (action === 'click') {
          return await handleClick(req, supabaseClient)
        } else if (action === 'revenue-sync') {
          return await handleRevenueSync(req, supabaseClient)
        }
        break
      
      case 'GET':
        if (action === 'stats') {
          return await getAdStats(supabaseClient)
        } else if (action === 'revenue') {
          return await getRevenueData(supabaseClient)
        }
        break
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })
  } catch (error) {
    console.error('Ad analytics error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleImpression(req: Request, supabase: any) {
  const data: AdImpressionData = await req.json()
  
  console.log('Processing ad impression:', data)

  // Get user ID from Authorization header if present
  const authHeader = req.headers.get('Authorization')
  let userId = data.user_id
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(jwt)
    if (!error && user) {
      userId = user.id
    }
  }

  // Store impression in database
  const { data: impression, error } = await supabase
    .from('ad_impressions')
    .insert({
      ad_id: data.ad_id,
      ad_unit_id: data.ad_unit_id,
      user_id: userId,
      session_id: data.session_id,
      revenue_cents: data.revenue_cents,
      device_info: data.device_info || {},
      location_data: data.location_data || {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error storing impression:', error)
    throw error
  }

  // Update daily summary
  await updateDailySummary(supabase, new Date())

  return new Response(JSON.stringify({ 
    success: true, 
    impression_id: impression.id,
    revenue_cents: data.revenue_cents 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleClick(req: Request, supabase: any) {
  const data: AdClickData = await req.json()
  
  console.log('Processing ad click:', data)

  // Update impression with click data
  const { error } = await supabase
    .from('ad_impressions')
    .update({
      was_clicked: true,
      click_timestamp: new Date().toISOString(),
      click_revenue_cents: data.click_revenue_cents,
    })
    .eq('id', data.impression_id)

  if (error) {
    console.error('Error updating click:', error)
    throw error
  }

  // Update daily summary
  await updateDailySummary(supabase, new Date())

  return new Response(JSON.stringify({ 
    success: true, 
    click_revenue_cents: data.click_revenue_cents 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleRevenueSync(req: Request, supabase: any) {
  const { date, adsense_earnings_cents } = await req.json()
  
  console.log('Syncing AdSense revenue for date:', date)

  // Update daily summary with actual AdSense earnings
  const { error } = await supabase
    .from('ad_revenue_summary')
    .upsert({
      date,
      adsense_earnings_cents,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error syncing revenue:', error)
    throw error
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getAdStats(supabase: any) {
  // Get today's stats
  const today = new Date().toISOString().split('T')[0]
  
  const { data: todayStats } = await supabase
    .from('ad_revenue_summary')
    .select('*')
    .eq('date', today)
    .single()

  // Get all-time totals
  const { data: allTimeStats } = await supabase
    .from('ad_impressions')
    .select('revenue_cents, click_revenue_cents, was_clicked')
    
  if (!allTimeStats) {
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const totalImpressions = allTimeStats.length
  const totalClicks = allTimeStats.filter(imp => imp.was_clicked).length
  const totalRevenue = allTimeStats.reduce((sum, imp) => 
    sum + imp.revenue_cents + (imp.click_revenue_cents || 0), 0)

  const stats = {
    today: todayStats || {
      total_impressions: 0,
      total_clicks: 0,
      total_revenue_cents: 0,
      ctr: 0,
      rpm_cents: 0
    },
    allTime: {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_revenue_cents: totalRevenue,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      rpm_cents: totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0
    }
  }

  return new Response(JSON.stringify(stats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getRevenueData(supabase: any) {
  const { data: revenueData } = await supabase
    .from('ad_revenue_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  return new Response(JSON.stringify(revenueData || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateDailySummary(supabase: any, date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  
  // Aggregate today's data
  const { data: impressions } = await supabase
    .from('ad_impressions')
    .select('revenue_cents, click_revenue_cents, was_clicked')
    .gte('timestamp', `${dateStr}T00:00:00Z`)
    .lt('timestamp', `${dateStr}T23:59:59Z`)

  if (!impressions) return

  const totalImpressions = impressions.length
  const totalClicks = impressions.filter(imp => imp.was_clicked).length
  const totalRevenue = impressions.reduce((sum, imp) => 
    sum + imp.revenue_cents + (imp.click_revenue_cents || 0), 0)
  const clickRevenue = impressions.reduce((sum, imp) => 
    sum + (imp.click_revenue_cents || 0), 0)

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const rpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0

  // Upsert daily summary
  await supabase
    .from('ad_revenue_summary')
    .upsert({
      date: dateStr,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_revenue_cents: totalRevenue,
      click_revenue_cents: clickRevenue,
      ctr: ctr,
      rpm_cents: Math.round(rpm),
      updated_at: new Date().toISOString(),
    })
}