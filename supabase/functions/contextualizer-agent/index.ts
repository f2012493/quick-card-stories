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

interface ContextualizerInput {
  article_id: string;
  content: string;
  headline: string;
  verifier_output: any;
  pipeline_id: string;
}

interface RelatedEvent {
  title: string;
  date: string;
  description: string;
  relevance_score: number;
}

interface ContextualizerOutput {
  historical_context: string;
  geopolitical_context: string;
  cultural_context: string;
  background_explainer: string;
  related_events: RelatedEvent[];
}

async function logAgent(pipelineId: string, level: string, message: string, context: any = {}) {
  await supabase.from('agent_logs').insert({
    pipeline_id: pipelineId,
    agent_type: 'contextualizer',
    log_level: level,
    message,
    context
  });
}

async function generateContext(content: string, headline: string, verifierOutput: any): Promise<ContextualizerOutput> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    As a contextual analysis AI, provide comprehensive context for this news story:
    
    Headline: ${headline}
    Content: ${content}
    Trust Score: ${verifierOutput.trust_score}
    
    Provide a JSON response with:
    1. historical_context: Historical background relevant to this story (2-3 sentences)
    2. geopolitical_context: Geopolitical implications and connections (2-3 sentences)
    3. cultural_context: Cultural significance and impact (2-3 sentences)
    4. background_explainer: Easy-to-understand background for general audiences (3-4 sentences)
    5. related_events: Array of 3-5 related historical events with title, date, description, and relevance_score (0-1)
    
    Focus on:
    - Providing accessible explanations
    - Connecting to broader patterns and trends
    - Historical precedents and parallels
    - Cultural and social implications
    - Geopolitical significance
    
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
        { role: 'system', content: 'You are a contextual analysis expert. Always return valid JSON with comprehensive context.' },
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
    historical_context: result.historical_context || 'Historical context not available.',
    geopolitical_context: result.geopolitical_context || 'Geopolitical context not available.',
    cultural_context: result.cultural_context || 'Cultural context not available.',
    background_explainer: result.background_explainer || 'Background information not available.',
    related_events: result.related_events || []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_id, content, headline, verifier_output, pipeline_id }: ContextualizerInput = await req.json();
    
    await logAgent(pipeline_id, 'info', 'Starting contextual analysis', { article_id });

    const startTime = Date.now();
    
    // Generate contextual analysis
    const contextResult = await generateContext(content, headline, verifier_output);
    
    const processingTime = Date.now() - startTime;

    // Store agent output
    await supabase.from('agent_outputs').insert({
      pipeline_id,
      agent_type: 'contextualizer',
      input_data: { article_id, content, headline, verifier_output },
      output_data: contextResult,
      processing_time_ms: processingTime,
      status: 'completed'
    });

    await logAgent(pipeline_id, 'info', 'Contextual analysis completed', { 
      processing_time_ms: processingTime,
      related_events_count: contextResult.related_events.length
    });

    return new Response(JSON.stringify(contextResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Contextualizer agent error:', error);
    
    const { pipeline_id } = await req.json().catch(() => ({ pipeline_id: 'unknown' }));
    await logAgent(pipeline_id, 'error', 'Contextual analysis failed', { error: error.message });

    return new Response(JSON.stringify({ 
      error: 'Contextual analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});