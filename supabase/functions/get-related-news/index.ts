
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelatedNewsRequest {
  headline: string;
  category: string;
  keywords?: string[];
}

interface RelatedNewsItem {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
}

const extractKeywords = (headline: string): string[] => {
  // Extract meaningful keywords from headline
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'will', 'has', 'have', 'had'];
  const words = headline.toLowerCase().split(/\s+/).filter(word => 
    word.length > 3 && 
    !commonWords.includes(word) &&
    /^[a-zA-Z]+$/.test(word)
  );
  
  return words.slice(0, 5); // Return top 5 keywords
};

const searchRelatedNews = async (keywords: string[], category: string): Promise<RelatedNewsItem[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
  const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';
  
  const relatedArticles: RelatedNewsItem[] = [];
  
  try {
    // Search NewsAPI with keywords
    const query = keywords.join(' OR ');
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${newsApiKey}`;
    
    console.log('Searching related news with query:', query);
    
    const response = await fetch(newsApiUrl);
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      data.articles.forEach((article: any) => {
        relatedArticles.push({
          headline: article.title,
          source: article.source?.name || 'Unknown Source',
          url: article.url,
          publishedAt: article.publishedAt,
          summary: article.description?.substring(0, 150) + '...' || 'No summary available'
        });
      });
    }
    
    // If we need more articles, try NewsData.io
    if (relatedArticles.length < 3) {
      try {
        const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&q=${encodeURIComponent(keywords[0])}&language=en&size=3`;
        
        const newsDataResponse = await fetch(newsDataUrl);
        const newsDataData = await newsDataResponse.json();
        
        if (newsDataData.results && newsDataData.results.length > 0) {
          newsDataData.results.forEach((article: any) => {
            if (relatedArticles.length < 5) {
              relatedArticles.push({
                headline: article.title,
                source: article.source_id || 'News Source',
                url: article.link,
                publishedAt: article.pubDate,
                summary: article.description?.substring(0, 150) + '...' || 'No summary available'
              });
            }
          });
        }
      } catch (error) {
        console.error('NewsData.io search failed:', error);
      }
    }
    
  } catch (error) {
    console.error('Error searching related news:', error);
  }
  
  return relatedArticles;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { headline, category, keywords }: RelatedNewsRequest = await req.json();
    
    console.log('Fetching related news for:', headline);

    // Extract keywords if not provided
    const searchKeywords = keywords && keywords.length > 0 ? keywords : extractKeywords(headline);
    
    // Search for related articles
    const relatedNews = await searchRelatedNews(searchKeywords, category);
    
    console.log(`Found ${relatedNews.length} related articles`);

    return new Response(
      JSON.stringify({
        relatedNews: relatedNews.slice(0, 5), // Return max 5 related articles
        keywords: searchKeywords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-related-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
