
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsAnalysisRequest {
  headline: string;
  tldr: string;
  content: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { headline, tldr, content, category }: NewsAnalysisRequest = await req.json();
    
    console.log('Analyzing news:', headline);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Analyze this news story and provide a structured breakdown:

HEADLINE: ${headline}
CATEGORY: ${category}
SUMMARY: ${tldr}
CONTENT: ${content}

Please provide a concise analysis in exactly this format:

WHAT HAPPENED:
[2-3 sentences explaining the core facts and events]

WHY IT MATTERS:
[2-3 sentences explaining the significance and implications]

WHO IT AFFECTS:
[2-3 sentences identifying the key stakeholders and impact groups]

Keep each section under 60 words. Be specific and avoid generic statements.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a news analyst. Provide clear, concise analysis that helps readers understand the story\'s significance. Avoid jargon and generic statements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Parse the structured response
    const sections = analysis.split('\n\n');
    let whatHappened = '';
    let whyItMatters = '';
    let whoItAffects = '';

    sections.forEach((section: string) => {
      if (section.includes('WHAT HAPPENED:')) {
        whatHappened = section.replace('WHAT HAPPENED:', '').trim();
      } else if (section.includes('WHY IT MATTERS:')) {
        whyItMatters = section.replace('WHY IT MATTERS:', '').trim();
      } else if (section.includes('WHO IT AFFECTS:')) {
        whoItAffects = section.replace('WHO IT AFFECTS:', '').trim();
      }
    });

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        whatHappened: whatHappened || 'Analysis of the core events and facts.',
        whyItMatters: whyItMatters || 'Analysis of the significance and implications.',
        whoItAffects: whoItAffects || 'Analysis of affected stakeholders and communities.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
