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

interface VerifierInput {
  article_id: string;
  content: string;
  headline: string;
  source_url?: string;
  pipeline_id: string;
}

interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  sources: string[];
  confidence: number;
}

interface VerifierOutput {
  factual_accuracy: number;
  trust_score: number;
  misinformation_flags: string[];
  verification_sources: string[];
  fact_check_results: FactCheckResult[];
}

async function logAgent(pipelineId: string, level: string, message: string, context: any = {}) {
  await supabase.from('agent_logs').insert({
    pipeline_id: pipelineId,
    agent_type: 'verifier',
    log_level: level,
    message,
    context
  });
}

async function performFactCheck(content: string, headline: string): Promise<VerifierOutput> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    As a fact-checking AI, analyze the following news content for factual accuracy:
    
    Headline: ${headline}
    Content: ${content}
    
    Provide a JSON response with:
    1. factual_accuracy: A score from 0-1 indicating how factually accurate the content is
    2. trust_score: A score from 0-1 indicating overall trustworthiness
    3. misinformation_flags: Array of potential misinformation concerns
    4. verification_sources: Array of recommended sources to verify claims
    5. fact_check_results: Array of specific claims with verdicts
    
    Focus on:
    - Verifiable facts and statistics
    - Source credibility
    - Potential bias or misleading information
    - Consistency with known factual information
    
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
        { role: 'system', content: 'You are a professional fact-checker. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    factual_accuracy: result.factual_accuracy || 0.5,
    trust_score: result.trust_score || 0.5,
    misinformation_flags: result.misinformation_flags || [],
    verification_sources: result.verification_sources || [],
    fact_check_results: result.fact_check_results || []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_id, content, headline, source_url, pipeline_id }: VerifierInput = await req.json();
    
    await logAgent(pipeline_id, 'info', 'Starting verification process', { article_id });

    const startTime = Date.now();
    
    // Perform fact-checking using OpenAI
    const verificationResult = await performFactCheck(content, headline);
    
    // Additional verification using source trust score
    if (source_url) {
      const domain = new URL(source_url).hostname;
      const { data: sourceData } = await supabase
        .from('news_sources')
        .select('trust_score')
        .eq('domain', domain)
        .single();
      
      if (sourceData) {
        // Adjust trust score based on source reputation
        verificationResult.trust_score = (verificationResult.trust_score + sourceData.trust_score) / 2;
      }
    }

    const processingTime = Date.now() - startTime;

    // Store agent output
    await supabase.from('agent_outputs').insert({
      pipeline_id,
      agent_type: 'verifier',
      input_data: { article_id, content, headline, source_url },
      output_data: verificationResult,
      processing_time_ms: processingTime,
      status: 'completed'
    });

    await logAgent(pipeline_id, 'info', 'Verification completed', { 
      processing_time_ms: processingTime,
      trust_score: verificationResult.trust_score 
    });

    return new Response(JSON.stringify(verificationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verifier agent error:', error);
    
    const { pipeline_id } = await req.json().catch(() => ({ pipeline_id: 'unknown' }));
    await logAgent(pipeline_id, 'error', 'Verification failed', { error: error.message });

    return new Response(JSON.stringify({ 
      error: 'Verification failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});