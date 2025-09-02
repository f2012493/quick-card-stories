import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ImpactInput {
  article_id: string;
  content: string;
  headline: string;
  analyst_output: any;
  pipeline_id: string;
}

interface ActionItem {
  type: 'petition' | 'contact' | 'learn' | 'vote' | 'donate';
  title: string;
  description: string;
  url?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ImpactOutput {
  societal_impact: string;
  user_impact: string;
  action_items: ActionItem[];
  further_reading: string[];
  what_to_watch: string[];
}

async function logAgent(pipelineId: string, level: string, message: string, context: any = {}) {
  await supabase.from('agent_logs').insert({
    pipeline_id: pipelineId,
    agent_type: 'impact',
    log_level: level,
    message,
    context
  });
}

async function generateImpactAnalysis(content: string, headline: string, analystOutput: any): Promise<ImpactOutput> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    As an impact analysis AI, determine actionable insights and societal impact for this news story:
    
    Headline: ${headline}
    Content: ${content}
    Analysis: ${JSON.stringify(analystOutput)}
    
    Provide a JSON response with:
    1. societal_impact: How this affects society as a whole (2-3 sentences)
    2. user_impact: How this directly affects individual readers (2-3 sentences)
    3. action_items: Array of 3-5 actionable items people can take, each with:
       - type: 'petition', 'contact', 'learn', 'vote', or 'donate'
       - title: Clear action title
       - description: What to do and why
       - url: Relevant URL if applicable
       - priority: 'high', 'medium', or 'low'
    4. further_reading: Array of 3-5 suggested topics or sources for deeper understanding
    5. what_to_watch: Array of 3-5 developments or indicators to monitor going forward
    
    Focus on:
    - Practical, actionable steps readers can take
    - Educational resources for deeper understanding
    - Future developments to track
    - Ways to get involved or make a difference
    - Staying informed on related topics
    
    Return only valid JSON.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an impact analysis expert focused on actionable insights. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    societal_impact: result.societal_impact || 'Societal impact assessment not available.',
    user_impact: result.user_impact || 'Personal impact assessment not available.',
    action_items: result.action_items || [],
    further_reading: result.further_reading || [],
    what_to_watch: result.what_to_watch || []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_id, content, headline, analyst_output, pipeline_id }: ImpactInput = await req.json();
    
    await logAgent(pipeline_id, 'info', 'Starting impact analysis', { article_id });

    const startTime = Date.now();
    
    // Generate impact analysis
    const impactResult = await generateImpactAnalysis(content, headline, analyst_output);
    
    const processingTime = Date.now() - startTime;

    // Store agent output
    await supabase.from('agent_outputs').insert({
      pipeline_id,
      agent_type: 'impact',
      input_data: { article_id, content, headline, analyst_output },
      output_data: impactResult,
      processing_time_ms: processingTime,
      status: 'completed'
    });

    await logAgent(pipeline_id, 'info', 'Impact analysis completed', { 
      processing_time_ms: processingTime,
      action_items_count: impactResult.action_items.length,
      reading_suggestions_count: impactResult.further_reading.length
    });

    return new Response(JSON.stringify(impactResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Impact agent error:', error);
    
    const { pipeline_id } = await req.json().catch(() => ({ pipeline_id: 'unknown' }));
    await logAgent(pipeline_id, 'error', 'Impact analysis failed', { error: error.message });

    return new Response(JSON.stringify({ 
      error: 'Impact analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});