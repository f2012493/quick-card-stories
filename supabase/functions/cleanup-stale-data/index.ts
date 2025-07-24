
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup of stale data...');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Mark expired clusters as stale
    const { data: expiredClusters } = await supabase
      .from('story_clusters')
      .update({ status: 'stale' })
      .lt('expires_at', now.toISOString())
      .eq('status', 'active')
      .select('id');

    console.log(`Marked ${expiredClusters?.length || 0} clusters as stale`);

    // 2. Archive old articles
    const { data: oldArticles } = await supabase
      .from('articles')
      .update({ status: 'archived' })
      .lt('published_at', oneWeekAgo.toISOString())
      .eq('status', 'active')
      .select('id');

    console.log(`Archived ${oldArticles?.length || 0} old articles`);

    // 3. Clean up expired personalized feeds
    const { data: expiredFeeds } = await supabase
      .from('personalized_feeds')
      .delete()
      .lt('expires_at', now.toISOString())
      .select('id');

    console.log(`Cleaned up ${expiredFeeds?.length || 0} expired feed entries`);

    // 4. Archive very old clusters (older than 7 days)
    const { data: veryOldClusters } = await supabase
      .from('story_clusters')
      .update({ status: 'archived' })
      .lt('created_at', oneWeekAgo.toISOString())
      .in('status', ['active', 'stale'])
      .select('id');

    console.log(`Archived ${veryOldClusters?.length || 0} very old clusters`);

    // 5. Clean up old reading history (older than 30 days for privacy)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: oldHistory } = await supabase
      .from('user_reading_history')
      .delete()
      .lt('read_at', thirtyDaysAgo.toISOString())
      .select('id');

    console.log(`Cleaned up ${oldHistory?.length || 0} old reading history entries`);

    return new Response(
      JSON.stringify({ 
        success: true,
        cleaned: {
          expired_clusters: expiredClusters?.length || 0,
          archived_articles: oldArticles?.length || 0,
          expired_feeds: expiredFeeds?.length || 0,
          archived_clusters: veryOldClusters?.length || 0,
          old_history: oldHistory?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
