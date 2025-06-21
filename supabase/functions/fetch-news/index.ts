import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&h=1920&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1080&h=1920&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1080&h=1920&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1080&h=1920&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1080&h=1920&fit=crop&crop=center'
];

const getHighQualityImage = (originalUrl: string, index: number): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return fallbackImages[index % fallbackImages.length];
  }
  
  // Enhance image quality for common news sources
  if (originalUrl.includes('unsplash.com')) {
    return originalUrl.replace(/w=\d+/, 'w=1080').replace(/h=\d+/, 'h=1920');
  }
  
  if (originalUrl.includes('pixabay.com')) {
    return originalUrl.replace(/_\d+\./, '_1280.');
  }
  
  // For other sources, try to get higher resolution
  if (originalUrl.includes('?')) {
    return `${originalUrl}&w=1080&h=1920&fit=crop&crop=center`;
  } else {
    return `${originalUrl}?w=1080&h=1920&fit=crop&crop=center`;
  }
};

const isWeatherRelated = (headline: string): boolean => {
  const weatherKeywords = ['weather', 'temperature', 'rain', 'snow', 'cloudy', 'sunny', 'storm', 'hurricane', 'climate'];
  const lowerHeadline = headline.toLowerCase();
  return weatherKeywords.some(keyword => lowerHeadline.includes(keyword));
};

const removeDuplicates = (news: NewsItem[]): NewsItem[] => {
  const uniqueHeadlines = new Set<string>();
  return news.filter(item => {
    if (uniqueHeadlines.has(item.headline)) {
      return false;
    }
    uniqueHeadlines.add(item.headline);
    return true;
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { category = 'general', pageSize = 20, country, city, region } = await req.json()
    
    console.log('Fetching news with enhanced image quality for:', { country, city, region, category, pageSize })

    let allNews: NewsItem[] = []

    // Fetch news from NewsAPI
    try {
      const newsApiKey = Deno.env.get('NEWSAPI_KEY');
      if (newsApiKey) {
        const url = `https://newsapi.org/v2/top-headlines?country=${country || 'us'}&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const news = data.articles.map((article: any) => ({
            id: crypto.randomUUID(),
            headline: article.title,
            tldr: article.description || 'No TLDR available',
            quote: article.content || 'No quote available',
            author: article.author || 'Unknown',
            category: category,
            imageUrl: article.urlToImage || '',
            readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
            publishedAt: article.publishedAt,
            sourceUrl: article.url
          }));
          allNews = allNews.concat(news);
        } else {
          console.error('NewsAPI error:', response.status, response.statusText);
        }
      } else {
        console.warn('NewsAPI key not found. Skipping NewsAPI.');
      }
    } catch (e) {
      console.error('Error fetching from NewsAPI:', e);
    }

    // Fetch news from NewsData.io
    try {
      const newsDataApiKey = Deno.env.get('NEWSDATAIO_API_KEY');
      if (newsDataApiKey) {
        const url = `https://newsdata.io/api/1/news?apikey=${newsDataApiKey}&country=${country || 'us'}&category=${category}&size=${pageSize}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const news = data.results.map((article: any) => ({
            id: crypto.randomUUID(),
            headline: article.title,
            tldr: article.description || 'No TLDR available',
            quote: article.content || 'No quote available',
            author: article.creator ? article.creator[0] : 'Unknown',
            category: category,
            imageUrl: article.image_url || '',
            readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
            publishedAt: article.pubDate,
            sourceUrl: article.link
          }));
          allNews = allNews.concat(news);
        } else {
          console.error('NewsData.io error:', response.status, response.statusText);
        }
      } else {
        console.warn('NewsData.io key not found. Skipping NewsData.io.');
      }
    } catch (e) {
      console.error('Error fetching from NewsData.io:', e);
    }
    
    // Fetch news from SerpApi (Google News)
    try {
      const serpApiKey = Deno.env.get('SERPAPI_KEY');
      if (serpApiKey) {
        const gl = country || 'US';
        const hl = country ? country.toLowerCase() : 'en';
        const url = `https://serpapi.com/search.json?engine=google_news&q=${category}&gl=${gl}&hl=${hl}&num=${pageSize}&api_key=${serpApiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const news = data.articles.map((article: any) => ({
            id: crypto.randomUUID(),
            headline: article.title,
            tldr: article.description || 'No TLDR available',
            quote: article.snippet || 'No quote available',
            author: article.source || 'Unknown',
            category: category,
            imageUrl: article.image || '',
            readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
            publishedAt: article.date,
            sourceUrl: article.link
          }));
          allNews = allNews.concat(news);
        } else {
          console.error('SerpApi error:', response.status, response.statusText);
        }
      } else {
        console.warn('SerpApi key not found. Skipping SerpApi.');
      }
    } catch (e) {
      console.error('Error fetching from SerpApi:', e);
    }

    // Enhanced image processing
    const processedNews = allNews.map((item, index) => ({
      ...item,
      imageUrl: getHighQualityImage(item.imageUrl, index),
      readTime: item.readTime || `${Math.floor(Math.random() * 3) + 2} min read`
    }));

    const uniqueNews = removeDuplicates(processedNews).slice(0, pageSize)
    
    console.log(`Returning ${uniqueNews.length} news articles with enhanced images`)
    
    return new Response(
      JSON.stringify({ news: uniqueNews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching news:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
