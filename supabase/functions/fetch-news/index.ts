
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    const { category = 'general', pageSize = 10 } = await req.json().catch(() => ({}));

    console.log(`Fetching news for category: ${category}, pageSize: ${pageSize}`);

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI error:', response.status, errorText);
      throw new Error(`NewsAPI request failed: ${response.status}`);
    }

    const data: NewsAPIResponse = await response.json();
    
    console.log(`Successfully fetched ${data.articles.length} articles`);

    // Transform NewsAPI data to match our app's format
    const transformedNews = data.articles
      .filter(article => article.title && article.description && article.urlToImage)
      .map((article, index) => ({
        id: `news-${Date.now()}-${index}`,
        headline: article.title,
        tldr: article.description,
        quote: `"${article.description.substring(0, 100)}..."`,
        author: article.author || article.source.name,
        category: getCategoryFromTitle(article.title),
        imageUrl: article.urlToImage,
        readTime: '2 min read',
        publishedAt: article.publishedAt,
        sourceUrl: article.url
      }));

    return new Response(JSON.stringify({ news: transformedNews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        news: [] 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getCategoryFromTitle(title: string): string {
  const techKeywords = ['AI', 'tech', 'digital', 'software', 'computer', 'internet', 'bitcoin', 'crypto'];
  const businessKeywords = ['market', 'economy', 'business', 'financial', 'stock', 'investment'];
  const healthKeywords = ['health', 'medical', 'hospital', 'disease', 'treatment', 'vaccine'];
  const politicsKeywords = ['president', 'government', 'election', 'congress', 'senate', 'politics'];
  
  const lowerTitle = title.toLowerCase();
  
  if (techKeywords.some(keyword => lowerTitle.includes(keyword))) return 'Tech';
  if (businessKeywords.some(keyword => lowerTitle.includes(keyword))) return 'Business';
  if (healthKeywords.some(keyword => lowerTitle.includes(keyword))) return 'Health';
  if (politicsKeywords.some(keyword => lowerTitle.includes(keyword))) return 'Politics';
  
  return 'General';
}
