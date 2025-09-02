import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormatterInput {
  verifier_output: any;
  contextualizer_output: any;
  analyst_output: any;
  impact_output: any;
  format: 'text' | 'bullets' | 'carousel' | 'video_script' | 'summary';
  language: 'en' | 'es' | 'hi' | 'fr' | 'de';
  tone: string;
}

interface FormattedOutput {
  title: string;
  summary: string;
  final_content: string;
}

async function formatContent(input: FormatterInput): Promise<FormattedOutput> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const languageMap = {
    'en': 'English',
    'es': 'Spanish',
    'hi': 'Hindi',
    'fr': 'French',
    'de': 'German'
  };

  const formatInstructions = {
    'text': 'Write as a comprehensive article with clear paragraphs and smooth transitions.',
    'bullets': 'Format as bullet points with clear, concise statements. Use • for main points and ◦ for sub-points.',
    'carousel': 'Format as 5-7 slide cards, each with a title and 2-3 sentences. Label each slide clearly.',
    'video_script': 'Write as a 60-second video script with natural speech patterns, pauses, and engaging delivery.',
    'summary': 'Write as a concise summary in 3-4 key paragraphs covering the most important points.'
  };

  const prompt = `
    Format this analyzed news content according to the user's preferences:
    
    AGENT OUTPUTS:
    Verification: ${JSON.stringify(input.verifier_output)}
    Context: ${JSON.stringify(input.contextualizer_output)}
    Analysis: ${JSON.stringify(input.analyst_output)}
    Impact: ${JSON.stringify(input.impact_output)}
    
    USER PREFERENCES:
    - Language: ${languageMap[input.language]}
    - Format: ${input.format}
    - Tone: ${input.tone}
    
    FORMAT INSTRUCTIONS: ${formatInstructions[input.format]}
    
    Create personalized content that:
    1. Incorporates all agent insights seamlessly
    2. Uses the specified language and tone
    3. Follows the exact format requirements
    4. Prioritizes verified information (trust score: ${input.verifier_output.trust_score})
    5. Includes actionable items from impact analysis
    6. Provides clear context and background
    
    Provide a JSON response with:
    - title: Engaging title in the specified language and tone
    - summary: Brief 2-sentence summary
    - final_content: Full formatted content according to specifications
    
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
        { role: 'system', content: 'You are a content formatter that creates personalized news content. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 3000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    title: result.title || 'News Update',
    summary: result.summary || 'Summary not available.',
    final_content: result.final_content || 'Content not available.'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: FormatterInput = await req.json();
    
    console.log('Formatting content with preferences:', {
      format: input.format,
      language: input.language,
      tone: input.tone
    });

    const formattedContent = await formatContent(input);

    return new Response(JSON.stringify(formattedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Content formatter error:', error);

    return new Response(JSON.stringify({ 
      error: 'Content formatting failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});