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

interface AnalystInput {
  article_id: string;
  content: string;
  headline: string;
  contextualizer_output: any;
  pipeline_id: string;
}

interface DataPoint {
  metric: string;
  value: string;
  context: string;
  significance: string;
}

interface AnalystOutput {
  key_insights: string[];
  implications: string[];
  data_points: DataPoint[];
  what_this_means: string;
  patterns_identified: string[];
}

async function logAgent(pipelineId: string, level: string, message: string, context: any = {}) {
  await supabase.from('agent_logs').insert({
    pipeline_id: pipelineId,
    agent_type: 'analyst',
    log_level: level,
    message,
    context
  });
}

async function performAnalysis(content: string, headline: string, contextualizerOutput: any): Promise<AnalystOutput> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    As an analytical AI, provide deep insights and analysis for this news story:
    
    Headline: ${headline}
    Content: ${content}
    Context: ${JSON.stringify(contextualizerOutput)}
    
    Provide a JSON response with:
    1. key_insights: Array of 3-5 key insights or findings from the story
    2. implications: Array of 3-5 potential implications or consequences
    3. data_points: Array of important data points with metric, value, context, and significance
    4. what_this_means: A clear 2-3 sentence summary of what this means for readers
    5. patterns_identified: Array of broader patterns or trends this story represents
    
    Focus on:
    - Economic implications
    - Social impact
    - Political ramifications
    - Technological significance
    - Environmental consequences
    - Long-term trends and patterns
    - Cause and effect relationships
    
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
        { role: 'system', content: 'You are an expert analyst. Always return valid JSON with deep insights.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    key_insights: result.key_insights || [],
    implications: result.implications || [],
    data_points: result.data_points || [],
    what_this_means: result.what_this_means || 'Analysis not available.',
    patterns_identified: result.patterns_identified || []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_id, content, headline, contextualizer_output, pipeline_id }: AnalystInput = await req.json();
    
    await logAgent(pipeline_id, 'info', 'Starting analytical processing', { article_id });

    const startTime = Date.now();
    
    // Perform analysis
    const analysisResult = await performAnalysis(content, headline, contextualizer_output);
    
    const processingTime = Date.now() - startTime;

    // Store agent output
    await supabase.from('agent_outputs').insert({
      pipeline_id,
      agent_type: 'analyst',
      input_data: { article_id, content, headline, contextualizer_output },
      output_data: analysisResult,
      processing_time_ms: processingTime,
      status: 'completed'
    });

    await logAgent(pipeline_id, 'info', 'Analysis completed', { 
      processing_time_ms: processingTime,
      insights_count: analysisResult.key_insights.length,
      data_points_count: analysisResult.data_points.length
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analyst agent error:', error);
    
    const { pipeline_id } = await req.json().catch(() => ({ pipeline_id: 'unknown' }));
    await logAgent(pipeline_id, 'error', 'Analysis failed', { error: error.message });

    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});