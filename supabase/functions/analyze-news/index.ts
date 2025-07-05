
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

    // Simple rule-based analysis instead of OpenAI
    const analyzeContent = (headline: string, tldr: string, content: string) => {
      const text = `${headline} ${tldr} ${content}`.toLowerCase();
      
      let whatHappened = '';
      let whyItMatters = '';
      let whoItAffects = '';

      // Basic content analysis
      if (text.includes('government') || text.includes('policy')) {
        whatHappened = 'Government policy changes or political developments are taking place.';
        whyItMatters = 'These changes could affect public services and citizen rights.';
        whoItAffects = 'Citizens and various stakeholder groups will be impacted.';
      } else if (text.includes('economy') || text.includes('business')) {
        whatHappened = 'Economic developments or business changes are occurring.';
        whyItMatters = 'These changes could influence market conditions and employment.';
        whoItAffects = 'Businesses, investors, and workers may be affected.';
      } else if (text.includes('health') || text.includes('medical')) {
        whatHappened = 'Health-related developments or medical news is emerging.';
        whyItMatters = 'This could impact public health and healthcare systems.';
        whoItAffects = 'Patients, healthcare workers, and the general public.';
      } else {
        whatHappened = 'Significant developments are taking place in this story.';
        whyItMatters = 'These events may have broader implications for the community.';
        whoItAffects = 'Various community members and stakeholders.';
      }

      return { whatHappened, whyItMatters, whoItAffects };
    };

    const analysis = analyzeContent(headline, tldr, content);

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(analysis),
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
