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

// Enhanced fallback images with higher quality and news-appropriate visuals
const fallbackImages = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1432888622747-4eb9a8a2c293?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85'
];

const getHighQualityImage = (originalUrl: string, index: number): string => {
  if (!originalUrl || originalUrl.includes('placeholder') || originalUrl.includes('default')) {
    return fallbackImages[index % fallbackImages.length];
  }
  
  // Enhanced image quality optimization
  if (originalUrl.includes('unsplash.com')) {
    const baseUrl = originalUrl.split('?')[0];
    return `${baseUrl}?w=1440&h=2560&fit=crop&crop=center&auto=format&q=85&dpr=2`;
  }
  
  if (originalUrl.includes('pixabay.com')) {
    return originalUrl.replace(/_\d+\./, '_1280.').replace(/&w=\d+/, '&w=1440').replace(/&h=\d+/, '&h=2560');
  }
  
  if (originalUrl.includes('pexels.com')) {
    return originalUrl.replace(/\?.*/, '?auto=compress&cs=tinysrgb&w=1440&h=2560&dpr=2');
  }
  
  // For news API images, try to enhance quality
  if (originalUrl.includes('newsapi.org') || originalUrl.includes('cdn.')) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}w=1440&h=2560&fit=crop&crop=smart&auto=format&q=85&dpr=2`;
  }
  
  // Generic enhancement for other sources
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}w=1440&h=2560&fit=crop&crop=center&auto=format&q=85&fm=webp`;
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

// Country code mapping for better API compatibility
const getCountryCode = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'India': 'in',
    'United States': 'us',
    'United Kingdom': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
    'Japan': 'jp',
    'China': 'cn',
    'Brazil': 'br'
  };
  
  return countryMap[country] || 'us';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { category = 'general', pageSize = 20, country, city, region } = await req.json()
    
    console.log('Fetching news with ultra-high quality images for:', { country, city, region, category, pageSize })

    let allNews: NewsItem[] = []
    const countryCode = getCountryCode(country || 'United States');

    // Fetch news from NewsAPI
    try {
      const newsApiKey = Deno.env.get('NEWSAPI_KEY');
      if (newsApiKey) {
        const url = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
        console.log('Calling NewsAPI with URL:', url);
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.articles && data.articles.length > 0) {
            const news = data.articles.map((article: any) => ({
              id: crypto.randomUUID(),
              headline: article.title,
              tldr: article.description || 'No description available',
              quote: article.content || 'Read more at source',
              author: article.author || article.source?.name || 'Unknown',
              category: category,
              imageUrl: article.urlToImage || '',
              readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
              publishedAt: article.publishedAt,
              sourceUrl: article.url
            }));
            allNews = allNews.concat(news);
            console.log(`NewsAPI returned ${news.length} articles`);
          }
        } else {
          console.error('NewsAPI error:', response.status, response.statusText);
        }
      }
    } catch (e) {
      console.error('Error fetching from NewsAPI:', e);
    }

    // If we don't have enough news from NewsAPI, try NewsData.io
    if (allNews.length < 10) {
      try {
        const newsDataApiKey = Deno.env.get('NEWSDATAIO_API_KEY');
        if (newsDataApiKey) {
          const url = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&country=${countryCode}&language=en&size=10&image=1`;
          console.log('Calling NewsData.io with URL:', url);
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const news = data.results.map((article: any) => ({
                id: crypto.randomUUID(),
                headline: article.title,
                tldr: article.description || 'No description available',
                quote: article.content || 'Read more at source',
                author: article.creator ? article.creator[0] : article.source_id || 'Unknown',
                category: category,
                imageUrl: article.image_url || '',
                readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
                publishedAt: article.pubDate,
                sourceUrl: article.link
              }));
              allNews = allNews.concat(news);
              console.log(`NewsData.io returned ${news.length} articles`);
            }
          } else {
            console.error('NewsData.io error:', response.status, response.statusText);
          }
        }
      } catch (e) {
        console.error('Error fetching from NewsData.io:', e);
      }
    }

    // Ultra-enhanced image processing with better quality
    const processedNews = allNews.map((item, index) => ({
      ...item,
      imageUrl: getHighQualityImage(item.imageUrl, index),
      readTime: item.readTime || `${Math.floor(Math.random() * 3) + 2} min read`
    }));

    const uniqueNews = removeDuplicates(processedNews).slice(0, pageSize)
    
    console.log(`Returning ${uniqueNews.length} news articles with ultra-high quality images`)
    
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
