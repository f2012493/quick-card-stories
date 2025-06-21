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

const unwantedPhrases = [
  'only available in paid plans',
  'subscribe to continue reading',
  'premium content',
  'the news mill',
  'breaking news',
  'read more',
  'click here',
  'advertisement',
  'sponsored content',
  'paywall',
  'sign up',
  'login required',
  'subscription required',
  'premium subscription',
  'free trial',
  'upgrade to premium',
  'full access',
  'unlimited access',
  'get latest articles',
  'follow us',
  'subscribe now',
  'continue reading',
  'developing story',
  'stay tuned',
  'more details expected',
  'developing news story',
  'situation continues to evolve',
  'closely monitored',
  'stakeholders for further updates',
  'multiple factors and stakeholders',
  'officials and experts analyze',
  'implications and next steps',
  'being analyzed',
  'continue to monitor',
  'updates as it develops'
];

const cleanContent = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove unwanted phrases (case insensitive)
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Remove common website artifacts and metadata
  cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces
  cleaned = cleaned.replace(/^\W+|\W+$/g, ''); // Leading/trailing non-word chars
  cleaned = cleaned.replace(/^(by\s+)?([a-z\s]+\s+-+)?\s*/i, ''); // Remove "By Author -" patterns
  cleaned = cleaned.replace(/^(source:|via:|from:)\s*/i, ''); // Remove source prefixes
  cleaned = cleaned.replace(/\b(photo|image|getty|reuters|ap|afp):\s*/gi, ''); // Remove photo credits
  
  return cleaned.trim();
};

const extractMeaningfulSentences = (content: string): string[] => {
  if (!content || content.length < 20) return [];
  
  const cleaned = cleanContent(content);
  if (cleaned.length < 20) return [];
  
  // Split into sentences and filter for meaningful content
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    const words = sentence.split(' ');
    return sentence.length > 20 && 
           words.length >= 5 && 
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           // Filter out vague sentences
           !sentence.toLowerCase().includes('according to') &&
           !sentence.toLowerCase().includes('sources say') &&
           !sentence.toLowerCase().includes('reports suggest') &&
           !sentence.toLowerCase().includes('it is believed') &&
           !sentence.toLowerCase().includes('officials said') &&
           // Check for actual content
           words.some(word => word.length > 4); // At least one substantial word
  });
  
  return sentences.slice(0, 4); // Take first 4 meaningful sentences
};

const createHeadlineBasedSummary = (headline: string): string => {
  // Extract key information from headline and create a focused summary
  const words = headline.toLowerCase();
  
  // Identify key entities and actions from headline
  let summary = headline;
  
  // Add minimal context based on headline content without generic phrases
  if (words.includes('court') || words.includes('judge') || words.includes('ruling')) {
    summary += '. The legal decision affects relevant parties and procedures.';
  } else if (words.includes('election') || words.includes('vote') || words.includes('campaign')) {
    summary += '. The electoral development impacts the political landscape.';
  } else if (words.includes('economic') || words.includes('market') || words.includes('financial')) {
    summary += '. The economic change influences market conditions and participants.';
  } else if (words.includes('technology') || words.includes('tech') || words.includes('ai')) {
    summary += '. The technological advancement represents a significant industry development.';
  } else {
    // For other topics, keep it very simple
    summary += '. This represents a notable development in the field.';
  }
  
  return summary;
};

const generateTLDR = (content: string, headline: string): string => {
  console.log(`Generating TL;DR for headline: "${headline}"`);
  console.log(`Content preview: "${content.substring(0, 200)}..."`);
  
  // Extract meaningful sentences from content
  const meaningfulSentences = extractMeaningfulSentences(content);
  
  if (meaningfulSentences.length === 0) {
    // If no meaningful content, create focused summary from headline only
    const headlineSummary = createHeadlineBasedSummary(headline);
    console.log(`Generated headline-based TL;DR: "${headlineSummary}"`);
    return headlineSummary.substring(0, 400);
  }
  
  // Build TL;DR from meaningful sentences
  let tldr = meaningfulSentences.join('. ').trim();
  
  // Ensure it ends with proper punctuation
  if (!tldr.endsWith('.') && !tldr.endsWith('!') && !tldr.endsWith('?')) {
    tldr += '.';
  }
  
  // Target around 60 words - if too long, trim to most important sentences
  const words = tldr.split(' ');
  
  if (words.length > 70) {
    // Take only the most substantial sentences
    const bestSentences = meaningfulSentences.slice(0, 2);
    tldr = bestSentences.join('. ') + '.';
  }
  
  console.log(`Generated TL;DR (${tldr.split(' ').length} words): "${tldr.substring(0, 100)}..."`);
  return tldr.substring(0, 400);
};

const generateNarrationText = (headline: string, tldr: string, content: string): string => {
  // Create a 60-second explainer (approximately 150-180 words for natural speech pace)
  const targetWords = 160;
  
  let narration = `Breaking News: ${headline}. `;
  let wordCount = narration.split(' ').length;
  
  // Add the TL;DR content if it's meaningful
  if (tldr && !unwantedPhrases.some(phrase => tldr.toLowerCase().includes(phrase.toLowerCase()))) {
    narration += `Here's what you need to know: ${tldr} `;
    wordCount = narration.split(' ').length;
  }
  
  // Add more context from meaningful content if available and we have space
  if (content && wordCount < targetWords - 20) {
    const meaningfulSentences = extractMeaningfulSentences(content);
    
    for (const sentence of meaningfulSentences.slice(0, 2)) {
      const sentenceWords = sentence.split(' ').length;
      if (wordCount + sentenceWords < targetWords) {
        narration += sentence + '. ';
        wordCount += sentenceWords;
      } else {
        break;
      }
    }
  }
  
  // Add a simple closing if we have space
  if (wordCount < targetWords - 5) {
    narration += "That's the latest update.";
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
    
    console.log('Fetching news with improved content filtering:', {
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

    // Transform articles to our format with improved content filtering
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.description || article.content || article.snippet || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        
        // Generate accurate TL;DR with improved filtering
        const tldr = generateTLDR(content, headline);
        
        // Generate narration text
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

    console.log(`Returning ${transformedNews.length} news articles with improved content filtering`);

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
