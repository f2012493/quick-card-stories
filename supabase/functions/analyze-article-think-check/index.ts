import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  articleId: string;
  headline: string;
  content: string;
  author?: string;
  sourceUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, headline, content, author, sourceUrl }: AnalysisRequest = await req.json();
    
    console.log('Analyzing article:', articleId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a media literacy expert analyzing news articles. Provide critical thinking insights in JSON format with these exact fields:

{
  "source": {
    "name": "source name or author",
    "bias": "left/center/right/unknown",
    "reliability": 0-100,
    "description": "brief analysis of source credibility"
  },
  "intent": {
    "type": "inform/persuade/provoke/entertain/sell",
    "confidence": 0-100,
    "explanation": "what the content is trying to achieve"
  },
  "emotions": [
    { "type": "fear/anger/joy/sadness/disgust/surprise", "intensity": 0-100 }
  ],
  "missing": [
    "list of perspectives, facts, or context that may be absent"
  ],
  "assumptions": [
    "implicit beliefs or values the article expects you to accept"
  ]
}

Be objective, educational, and non-partisan. Focus on media literacy, not political bias.`;

    const userPrompt = `Analyze this article critically:

Headline: ${headline}
Author: ${author || 'Unknown'}
Source URL: ${sourceUrl || 'Unknown'}

Content:
${content.substring(0, 3000)}

Provide a complete JSON analysis following the schema.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Extract JSON from markdown code blocks if present
    let analysisJson = aiResponse;
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      analysisJson = jsonMatch[1];
    }

    const analysis = JSON.parse(analysisJson);

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        articleId,
        analysis,
        disclaimer: 'AI-generated insights – may contain errors. Use as a starting point for critical thinking.',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-article-think-check:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to analyze article. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
