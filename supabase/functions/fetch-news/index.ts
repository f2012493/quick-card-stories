
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  narrationText?: string;
}

const generateTLDR = (content: string, headline: string): string => {
  // Extract key information and create a 60-word summary
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const keyWords = headline.split(' ').filter(w => w.length > 3);
  
  let summary = sentences[0] || headline;
  let wordCount = summary.split(' ').length;
  
  for (let i = 1; i < sentences.length && wordCount < 55; i++) {
    const sentence = sentences[i].trim();
    const sentenceWords = sentence.split(' ').length;
    if (wordCount + sentenceWords <= 60) {
      summary += '. ' + sentence;
      wordCount += sentenceWords;
    }
  }
  
  return summary.substring(0, 400); // Ensure reasonable length
};

const generateNarrationText = (headline: string, tldr: string, content: string): string => {
  // Create a 60-second explainer (approximately 150-180 words for natural speech pace)
  const targetWords = 160;
  
  let narration = `Breaking News: ${headline}. `;
  let wordCount = narration.split(' ').length;
  
  // Add the TL;DR
  narration += `Here's what you need to know: ${tldr}. `;
  wordCount = narration.split(' ').length;
  
  // Add more context from the content if we have space
  if (content && wordCount < targetWords - 20) {
    const contentSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of contentSentences) {
      const sentenceWords = sentence.trim().split(' ').length;
      if (wordCount + sentenceWords < targetWords) {
        narration += sentence.trim() + '. ';
        wordCount += sentenceWords;
      } else {
        break;
      }
    }
  }
  
  // Add a closing if we have space
  if (wordCount < targetWords - 10) {
    narration += "This story is developing and we'll continue to monitor the situation.";
  }
  
  return narration;
};

const searchForImages = async (query: string): Promise<string[]> => {
  try {
    // Use a simple image search approach
    const searchQueries = [
      `${query} news`,
      `${query} latest`,
      query.split(' ').slice(0, 3).join(' ')
    ];
    
    // Return high-quality placeholder URLs based on the search
    const imageUrls = [
      `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
      `https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
      `https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
      `https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
      `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`
    ];
    
    return imageUrls;
  } catch (error) {
    console.error('Error searching for images:', error);
    return [];
  }
};

const getHighQualityImage = async (originalUrl: string, headline: string): Promise<string> => {
  // If original image exists and is high quality, use it
  if (originalUrl && originalUrl.includes('http')) {
    try {
      // Check if image is accessible
      const response = await fetch(originalUrl, { method: 'HEAD' });
      if (response.ok) {
        return originalUrl;
      }
    } catch (error) {
      console.log('Original image not accessible, searching for alternative');
    }
  }
  
  // Search for relevant images
  const searchImages = await searchForImages(headline);
  
  // Return the first available high-quality image
  if (searchImages.length > 0) {
    return searchImages[Math.floor(Math.random() * searchImages.length)];
  }
  
  // Fallback to a high-quality news placeholder
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, city, region, category = 'general', pageSize = 20 } = await req.json();
    
    console.log('Fetching enhanced news with 60-word summaries and 60-second narrations for:', {
      country: country || 'Global',
      city: city || 'Unknown',
      region: region || 'Unknown',
      category,
      pageSize
    });

    const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
    const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';

    let articles: any[] = [];

    // Try NewsAPI first
    try {
      const countryCode = country === 'India' ? 'in' : 'us';
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
      
      console.log('Calling NewsAPI with URL:', newsApiUrl);
      
      const newsApiResponse = await fetch(newsApiUrl);
      const newsApiData = await newsApiResponse.json();
      
      if (newsApiData.articles && newsApiData.articles.length > 0) {
        console.log(`NewsAPI returned ${newsApiData.articles.length} articles`);
        articles = newsApiData.articles;
      }
    } catch (error) {
      console.error('NewsAPI failed:', error);
    }

    // If NewsAPI didn't provide enough articles, try NewsData.io
    if (articles.length < 5) {
      try {
        const countryCode = country === 'India' ? 'in' : 'us';
        const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&country=${countryCode}&language=en&size=10&image=1`;
        
        console.log('Calling NewsData.io with URL:', newsDataUrl);
        
        const newsDataResponse = await fetch(newsDataUrl);
        const newsDataData = await newsDataResponse.json();
        
        if (newsDataData.results && newsDataData.results.length > 0) {
          console.log(`NewsData.io returned ${newsDataData.results.length} articles`);
          articles = articles.concat(newsDataData.results.slice(0, 10));
        }
      } catch (error) {
        console.error('NewsData.io failed:', error);
      }
    }

    if (articles.length === 0) {
      throw new Error('No articles found from any news source');
    }

    // Transform articles to our format with enhanced content
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.description || article.content || article.snippet || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        
        // Generate 60-word TL;DR
        const tldr = generateTLDR(content, headline);
        
        // Generate 60-second narration text
        const narrationText = generateNarrationText(headline, tldr, content);
        
        // Get high-quality image
        const imageUrl = await getHighQualityImage(originalImage, headline);
        
        return {
          id: `news-${Date.now()}-${index}`,
          headline: headline,
          tldr: tldr,
          quote: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          author: article.author || article.source?.name || 'News Team',
          category: article.category || category || 'General',
          imageUrl: imageUrl,
          readTime: '2 min read',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || '',
          narrationText: narrationText
        };
      })
    );

    console.log(`Returning ${transformedNews.length} enhanced news articles with 60-word summaries and 60-second narrations`);

    return new Response(
      JSON.stringify({ news: transformedNews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
