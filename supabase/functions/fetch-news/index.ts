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

interface NewsDataArticle {
  title: string;
  description: string;
  link: string;
  image_url: string;
  pubDate: string;
  source_id: string;
  creator?: string[];
}

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
}

interface SerpApiArticle {
  title: string;
  snippet: string;
  link: string;
  thumbnail?: string;
  date: string;
  source: string;
}

interface SerpApiResponse {
  news_results: SerpApiArticle[];
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

const newsDataCountryMap: { [key: string]: string } = {
  'United States': 'us',
  'Canada': 'ca', 
  'United Kingdom': 'gb',
  'Australia': 'au',
  'Germany': 'de',
  'France': 'fr',
  'Italy': 'it',
  'Spain': 'es',
  'India': 'in',
  'Japan': 'jp',
  'Brazil': 'br',
  'China': 'cn'
};

async function fetchFromNewsAPI(category: string, pageSize: number, country?: string) {
  const newsApiKey = Deno.env.get('NEWS_API_KEY');
  if (!newsApiKey) return null;

  try {
    // Focus on country-only search to avoid weather updates
    const countryCode = country ? (countryCodeMap[country] || 'us') : 'us';
    const countryUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
    
    console.log(`NewsAPI: Fetching country-specific news for ${countryCode}`);
    
    const countryResponse = await fetch(countryUrl);
    if (countryResponse.ok) {
      const countryData: NewsAPIResponse = await countryResponse.json();
      console.log(`NewsAPI country search returned ${countryData.articles?.length || 0} articles`);
      
      if (countryData.articles && countryData.articles.length > 0) {
        // Filter out weather-related articles
        const filteredArticles = countryData.articles.filter(article => {
          const lowerTitle = article.title.toLowerCase();
          const lowerDescription = (article.description || '').toLowerCase();
          const weatherKeywords = ['weather', 'temperature', 'rain', 'snow', 'storm', 'forecast', 'degrees', 'celsius', 'fahrenheit'];
          
          return !weatherKeywords.some(keyword => 
            lowerTitle.includes(keyword) || lowerDescription.includes(keyword)
          );
        });
        
        console.log(`Filtered out weather articles, remaining: ${filteredArticles.length}`);
        return filteredArticles;
      }
    }

    return null;
  } catch (error) {
    console.error('NewsAPI error:', error);
    return null;
  }
}

async function fetchFromNewsData(category: string, pageSize: number, country?: string) {
  const newsDataKey = Deno.env.get('NEWSDATA_API_KEY');
  if (!newsDataKey) return null;

  try {
    const countryCode = country ? newsDataCountryMap[country] : undefined;

    const baseUrl = 'https://newsdata.io/api/1/news';
    const params = new URLSearchParams({
      apikey: newsDataKey,
      category: category === 'general' ? 'top' : category,
      size: pageSize.toString(),
      language: 'en'
    });

    if (countryCode) {
      params.append('country', countryCode);
    }

    // Exclude weather-related content
    params.append('qInMeta', '-weather,-forecast,-temperature');

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`NewsData.io: Fetching country-specific news for ${countryCode || 'all'}`);

    const response = await fetch(url);
    if (response.ok) {
      const data: NewsDataResponse = await response.json();
      console.log(`NewsData.io returned ${data.results?.length || 0} articles`);
      
      if (data.results && data.results.length > 0) {
        // Additional client-side filtering for weather content
        const filteredResults = data.results.filter(article => {
          const lowerTitle = article.title.toLowerCase();
          const lowerDescription = (article.description || '').toLowerCase();
          const weatherKeywords = ['weather', 'temperature', 'rain', 'snow', 'storm', 'forecast', 'degrees', 'celsius', 'fahrenheit'];
          
          return !weatherKeywords.some(keyword => 
            lowerTitle.includes(keyword) || lowerDescription.includes(keyword)
          );
        });

        return filteredResults.map(article => ({
          title: article.title,
          description: article.description || 'No description available',
          url: article.link,
          urlToImage: article.image_url,
          publishedAt: article.pubDate,
          source: { name: article.source_id },
          author: article.creator?.[0]
        }));
      }
    }

    return null;
  } catch (error) {
    console.error('NewsData.io error:', error);
    return null;
  }
}

async function fetchFromSerpApi(category: string, pageSize: number, country?: string) {
  const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
  if (!serpApiKey) return null;

  try {
    let query = category === 'general' ? 'news' : `${category} news`;
    
    // Add country context and exclude weather
    if (country) {
      query += ` ${country} -weather -forecast -temperature`;
    } else {
      query += ' -weather -forecast -temperature';
    }

    const url = `https://serpapi.com/search.json?engine=google&tbm=nws&q=${encodeURIComponent(query)}&num=${pageSize}&api_key=${serpApiKey}`;
    console.log(`SerpApi: Fetching country-specific news with query: ${query}`);

    const response = await fetch(url);
    if (response.ok) {
      const data: SerpApiResponse = await response.json();
      console.log(`SerpApi returned ${data.news_results?.length || 0} articles`);
      
      if (data.news_results && data.news_results.length > 0) {
        // Additional filtering for weather content
        const filteredResults = data.news_results.filter(article => {
          const lowerTitle = article.title.toLowerCase();
          const lowerSnippet = (article.snippet || '').toLowerCase();
          const weatherKeywords = ['weather', 'temperature', 'rain', 'snow', 'storm', 'forecast', 'degrees', 'celsius', 'fahrenheit'];
          
          return !weatherKeywords.some(keyword => 
            lowerTitle.includes(keyword) || lowerSnippet.includes(keyword)
          );
        });

        return filteredResults.map(article => ({
          title: article.title,
          description: article.snippet || 'No description available',
          url: article.link,
          urlToImage: article.thumbnail || '/placeholder.svg',
          publishedAt: article.date,
          source: { name: article.source },
          author: article.source
        }));
      }
    }

    return null;
  } catch (error) {
    console.error('SerpApi error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      category = 'general', 
      pageSize = 20, 
      country 
    } = await req.json().catch(() => ({}));

    console.log(`Fetching country-specific news for category: ${category}, pageSize: ${pageSize}, country: ${country}`);

    let articles: any[] = [];

    // Try NewsAPI first (country-specific only)
    console.log('Trying NewsAPI for country-specific news...');
    const newsApiArticles = await fetchFromNewsAPI(category, pageSize, country);
    if (newsApiArticles && newsApiArticles.length > 0) {
      articles = newsApiArticles;
      console.log(`NewsAPI provided ${articles.length} articles`);
    }

    // If NewsAPI didn't provide enough articles, try NewsData.io
    if (articles.length < pageSize / 2) {
      console.log('Trying NewsData.io for additional country-specific news...');
      const newsDataArticles = await fetchFromNewsData(category, pageSize, country);
      if (newsDataArticles && newsDataArticles.length > 0) {
        articles = articles.concat(newsDataArticles);
        console.log(`Added ${newsDataArticles.length} articles from NewsData.io, total: ${articles.length}`);
      }
    }

    // If still not enough articles, try SerpApi
    if (articles.length < pageSize / 2) {
      console.log('Trying SerpApi for additional country-specific news...');
      const serpApiArticles = await fetchFromSerpApi(category, pageSize, country);
      if (serpApiArticles && serpApiArticles.length > 0) {
        articles = articles.concat(serpApiArticles);
        console.log(`Added ${serpApiArticles.length} articles from SerpApi, total: ${articles.length}`);
      }
    }

    // Final fallback to US general news from NewsAPI
    if (articles.length === 0) {
      console.log('Trying final fallback to US general news via NewsAPI');
      const fallbackUrl = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${pageSize}&apiKey=${Deno.env.get('NEWS_API_KEY')}`;
      
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const data: NewsAPIResponse = await fallbackResponse.json();
        if (data.articles && data.articles.length > 0) {
          // Filter weather content from fallback too
          const filteredFallback = data.articles.filter(article => {
            const lowerTitle = article.title.toLowerCase();
            const lowerDescription = (article.description || '').toLowerCase();
            const weatherKeywords = ['weather', 'temperature', 'rain', 'snow', 'storm', 'forecast', 'degrees', 'celsius', 'fahrenheit'];
            
            return !weatherKeywords.some(keyword => 
              lowerTitle.includes(keyword) || lowerDescription.includes(keyword)
            );
          });
          
          articles = filteredFallback;
          console.log(`Fallback returned ${articles.length} articles after weather filtering`);
        }
      }
    }

    if (articles.length === 0) {
      console.log('No articles available from any source');
      return new Response(JSON.stringify({ news: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove duplicates based on title similarity
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => 
        a.title.toLowerCase().substring(0, 50) === article.title.toLowerCase().substring(0, 50)
      )
    );

    // Transform and filter articles
    const transformedNews = uniqueArticles
      .filter(article => {
        const hasRequiredFields = article.title && article.description && article.urlToImage && article.urlToImage !== '/placeholder.svg';
        if (!hasRequiredFields) {
          console.log('Filtered out article missing required fields:', article.title || 'Unknown title');
        }
        return hasRequiredFields;
      })
      .slice(0, pageSize) // Limit to requested page size
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

    console.log(`Successfully transformed ${transformedNews.length} unique country-specific articles`);

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
