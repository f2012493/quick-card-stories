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
  trustScore?: number;
  localRelevance?: number;
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
  'updates as it develops',
  'this represents a notable development',
  'this development is being',
  'the situation continues',
  'more information becomes available',
  'authorities and stakeholders',
  'relevant authorities',
  'situation as it updates',
  'news development involves',
  'continues to evolve',
  'being closely monitored',
  'key development involving',
  'situation involving',
  'development in',
  'notable development',
  'significant development'
];

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatTLDR = (text: string): string => {
  if (!text) return text;
  
  let cleanedText = text.trim();
  const sentences = cleanedText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  const formattedSentences = sentences.map(sentence => {
    if (!sentence) return '';
    
    const words = sentence.split(/\s+/);
    const formattedWords = words.map((word, index) => {
      if (!word) return word;
      
      if (index === 0) {
        return capitalizeFirstLetter(word.toLowerCase());
      }
      
      if (word.match(/^[A-Z]{2,}$/)) {
        return word;
      }
      
      if (word.match(/^[A-Z][a-z]+$/)) {
        return word;
      }
      
      if (word.match(/^[A-Z][a-z]*[A-Z]/)) {
        return word;
      }
      
      const lowercaseWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall'];
      
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      return capitalizeFirstLetter(word.toLowerCase());
    });
    
    return formattedWords.join(' ');
  });
  
  let result = formattedSentences.join('. ');
  
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result;
};

const generateSmartFallback = (content: string, headline: string, description: string = ''): string => {
  console.log(`Generating smart fallback for: "${headline}"`);
  
  const fullContent = `${description} ${content}`.trim();
  
  if (!fullContent || fullContent.length < 20) {
    return formatTLDR(extractFromHeadline(headline));
  }

  let cleaned = fullContent.toLowerCase();
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  cleaned = cleaned.replace(/\b(according to|reports suggest|sources say|it is reported|officials said|experts believe)\b/gi, '');
  cleaned = cleaned.replace(/\b(in a statement|in an interview|during a press conference)\b/gi, '');
  
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    return sentence.length > 15 && 
           sentence.split(' ').length >= 5 &&
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           !sentence.match(/^\s*(the|this|that|it|there)\s+/i);
  });

  if (sentences.length > 0) {
    let summary = sentences[0].trim();
    
    const words = summary.split(' ');
    if (words.length > 45) {
      summary = words.slice(0, 40).join(' ') + '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }
    
    return formatTLDR(summary);
  }

  return formatTLDR(extractFromHeadline(headline));
};

const extractFromHeadline = (headline: string): string => {
  let summary = headline.trim();
  
  if (summary.startsWith('"') && summary.endsWith('"')) {
    summary = summary.slice(1, -1);
  }
  
  if (summary.split(' ').length <= 8) {
    return summary + (summary.endsWith('.') ? '' : '.');
  }
  
  const words = summary.split(' ');
  if (words.length > 15) {
    const firstPart = words.slice(0, 12).join(' ');
    return firstPart + (firstPart.endsWith('.') ? '' : '...');
  }
  
  return summary + (summary.endsWith('.') ? '' : '.');
};

const generateTLDR = async (content: string, headline: string, description: string = ''): Promise<string> => {
  console.log(`Generating TL;DR for: "${headline}"`);
  
  // Simple rule-based TL;DR generation instead of OpenAI
  const fullContent = `${description} ${content}`.trim();
  
  if (fullContent.length > 20) {
    return generateSmartFallback(fullContent, headline, description);
  }
  
  // Fallback summary
  return generateSmartFallback(fullContent, headline, description);
};

const calculateTrustScore = (sourceName: string): number => {
  const trustScores: { [key: string]: number } = {
    'Guardian': 0.9,
    'BBC': 0.95,
    'Reuters': 0.92,
    'CNN': 0.8,
    'Associated Press': 0.93,
    'NPR': 0.88,
    'Wall Street Journal': 0.87,
    'New York Times': 0.85
  };
  
  return trustScores[sourceName] || 0.7;
};

const calculateLocalRelevance = (title: string, description: string, location?: string): number => {
  const content = `${title} ${description}`.toLowerCase();
  let relevanceScore = 0.5;

  const locationKeywords = ['local', 'city', 'state', 'community', 'region', 'municipal', 'county'];
  const impactKeywords = ['economy', 'jobs', 'school', 'transport', 'housing', 'health', 'safety'];
  
  if (locationKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.3;
  if (impactKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.2;
  
  if (location) {
    const locationParts = location.toLowerCase().split(',').map(part => part.trim());
    if (locationParts.some(part => content.includes(part))) relevanceScore += 0.4;
  }

  return Math.min(1, relevanceScore);
};

const getContextualPlaceholder = (headline: string, description: string = ''): string => {
  const content = `${headline} ${description}`.toLowerCase();
  
  // Business/Economy themed images
  if (content.includes('economy') || content.includes('market') || content.includes('business') || content.includes('financial')) {
    return `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Technology themed images
  if (content.includes('technology') || content.includes('ai') || content.includes('digital') || content.includes('startup')) {
    return `https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Politics/Government themed images
  if (content.includes('modi') || content.includes('bjp') || content.includes('congress') || content.includes('election') || content.includes('government')) {
    return `https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Healthcare themed images
  if (content.includes('health') || content.includes('medical') || content.includes('hospital') || content.includes('vaccine')) {
    return `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Environment/Climate themed images
  if (content.includes('climate') || content.includes('environment') || content.includes('pollution') || content.includes('green')) {
    return `https://images.unsplash.com/photo-1569163139394-de44cb33c2a0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // City/Urban themed images for city-specific news
  if (content.includes('mumbai') || content.includes('delhi') || content.includes('bangalore') || content.includes('chennai')) {
    return `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Default news/breaking news image
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, city, region, category = 'general', pageSize = 20 } = await req.json();
    
    console.log('Fetching news with enhanced image search:', {
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

    const locationString = city && country ? `${city}, ${country}` : country || '';

    // Transform articles with TL;DR generation and relevant images
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.content || article.snippet || '';
        const description = article.description || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const sourceName = article.source?.name || 'News Source';
        
        // Generate TL;DR without OpenAI
        const tldr = await generateTLDR(content, headline, description);
        
        // Use original image or contextual placeholder
        const imageUrl = originalImage || getContextualPlaceholder(headline, description);
        
        return {
          id: `news-${Date.now()}-${index}`,
          headline: headline,
          tldr: tldr,
          quote: (description || content).substring(0, 200) + ((description || content).length > 200 ? '...' : ''),
          author: article.author || sourceName,
          category: '',
          imageUrl: imageUrl,
          readTime: '2 min read',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || '',
          trustScore: calculateTrustScore(sourceName),
          localRelevance: calculateLocalRelevance(headline, description, locationString)
        };
      })
    );

    console.log(`Returning ${transformedNews.length} news articles`);

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
