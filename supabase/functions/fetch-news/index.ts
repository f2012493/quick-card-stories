
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

// Move countryCodeMap to global scope
const countryCodeMap: { [key: string]: string } = {
  'United States': 'us',
  'Canada': 'ca',
  'United Kingdom': 'gb',
  'Australia': 'au',
  'Germany': 'de',
  'France': 'fr',
  'Italy': 'it',
  'Spain': 'es',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'Switzerland': 'ch',
  'Austria': 'at',
  'Sweden': 'se',
  'Norway': 'no',
  'Denmark': 'dk',
  'Finland': 'fi',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Hungary': 'hu',
  'Portugal': 'pt',
  'Greece': 'gr',
  'Ireland': 'ie',
  'Russia': 'ru',
  'Ukraine': 'ua',
  'Turkey': 'tr',
  'Israel': 'il',
  'Saudi Arabia': 'sa',
  'United Arab Emirates': 'ae',
  'Egypt': 'eg',
  'South Africa': 'za',
  'Nigeria': 'ng',
  'Kenya': 'ke',
  'Morocco': 'ma',
  'India': 'in',
  'China': 'cn',
  'Japan': 'jp',
  'South Korea': 'kr',
  'Thailand': 'th',
  'Malaysia': 'my',
  'Singapore': 'sg',
  'Philippines': 'ph',
  'Indonesia': 'id',
  'Vietnam': 'vn',
  'Taiwan': 'tw',
  'Hong Kong': 'hk',
  'New Zealand': 'nz',
  'Argentina': 'ar',
  'Brazil': 'br',
  'Chile': 'cl',
  'Colombia': 'co',
  'Mexico': 'mx',
  'Peru': 'pe',
  'Venezuela': 've'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!newsApiKey) {
      console.error('NEWS_API_KEY not configured');
      throw new Error('NEWS_API_KEY not configured');
    }

    const { 
      category = 'general', 
      pageSize = 20, 
      country,
      city,
      region 
    } = await req.json().catch(() => ({}));

    console.log(`Fetching news for category: ${category}, pageSize: ${pageSize}, location: ${city}, ${region}, ${country}`);

    let data: NewsAPIResponse | null = null;

    // Try location-specific search first if we have location data
    if (country && (city || region)) {
      const countryCode = countryCodeMap[country] || 'us';
      const locationTerms = [city, region].filter(Boolean).join(' OR ');
      const locationUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&q=${encodeURIComponent(locationTerms)}&apiKey=${newsApiKey}`;
      
      console.log(`Trying location-specific search with country code: ${countryCode} and terms: ${locationTerms}`);
      
      try {
        const locationResponse = await fetch(locationUrl);
        if (locationResponse.ok) {
          const locationData: NewsAPIResponse = await locationResponse.json();
          console.log(`Location search returned ${locationData.articles?.length || 0} articles`);
          
          if (locationData.articles && locationData.articles.length > 0) {
            data = locationData;
          }
        }
      } catch (error) {
        console.error('Location-specific search failed:', error);
      }
    }

    // If location search didn't return results, try country-only search
    if (!data || !data.articles || data.articles.length === 0) {
      const countryCode = country ? (countryCodeMap[country] || 'us') : 'us';
      const countryUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
      
      console.log(`Trying country-only search with country code: ${countryCode}`);
      
      try {
        const countryResponse = await fetch(countryUrl);
        if (countryResponse.ok) {
          const countryData: NewsAPIResponse = await countryResponse.json();
          console.log(`Country search returned ${countryData.articles?.length || 0} articles`);
          
          if (countryData.articles && countryData.articles.length > 0) {
            data = countryData;
          }
        }
      } catch (error) {
        console.error('Country search failed:', error);
      }
    }

    // Final fallback to US general news if nothing else worked
    if (!data || !data.articles || data.articles.length === 0) {
      const fallbackUrl = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
      
      console.log('Trying final fallback to US general news');
      
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text();
        console.error('Final fallback failed:', fallbackResponse.status, errorText);
        throw new Error(`NewsAPI request failed: ${fallbackResponse.status} - ${errorText}`);
      }

      data = await fallbackResponse.json();
      console.log(`Fallback returned ${data.articles?.length || 0} articles`);
    }

    if (!data || !data.articles || data.articles.length === 0) {
      console.log('No articles available from any source');
      return new Response(JSON.stringify({ news: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform NewsAPI data to match our app's format
    const transformedNews = data.articles
      .filter(article => {
        const hasRequiredFields = article.title && article.description && article.urlToImage;
        if (!hasRequiredFields) {
          console.log('Filtered out article missing required fields:', article.title || 'Unknown title');
        }
        return hasRequiredFields;
      })
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

    console.log(`Successfully transformed ${transformedNews.length} articles`);

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
