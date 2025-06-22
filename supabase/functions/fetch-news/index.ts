
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
}

// Enhanced filtering for clickbait and low-quality content
const clickbaitPhrases = [
  'you won\'t believe',
  'shocking',
  'this will blow your mind',
  'doctors hate this',
  'click here',
  'what happens next',
  'the reason why',
  'you need to see this',
  'this changes everything',
  'wait until you see',
  'the truth about',
  'secrets revealed',
  'insider reveals',
  'leaked',
  'exclusive footage',
  'viral video',
  'must watch',
  'gone wrong',
  'prank',
  'reaction video',
  'compilation'
];

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

const isClickbait = (headline: string, content: string = ''): boolean => {
  const textToCheck = `${headline} ${content}`.toLowerCase();
  return clickbaitPhrases.some(phrase => textToCheck.includes(phrase.toLowerCase()));
};

const isValidNewsArticle = (article: any): boolean => {
  const headline = article.title || article.headline || '';
  const content = article.content || article.description || '';
  
  // Filter out clickbait
  if (isClickbait(headline, content)) {
    return false;
  }
  
  // Filter out very short headlines (likely incomplete)
  if (headline.length < 20) {
    return false;
  }
  
  // Filter out articles without proper content
  if (!content || content.length < 50) {
    return false;
  }
  
  // Filter out promotional content
  const promotionalKeywords = ['advertisement', 'sponsored', 'promo', 'buy now', 'limited time'];
  if (promotionalKeywords.some(keyword => headline.toLowerCase().includes(keyword))) {
    return false;
  }
  
  return true;
};

const removeDuplicates = (articles: any[]): any[] => {
  const seen = new Set();
  const uniqueArticles = [];
  
  for (const article of articles) {
    const headline = (article.title || article.headline || '').toLowerCase();
    
    // Create a simplified version of the headline for comparison
    const simplified = headline
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5) // First 5 words
      .join(' ');
    
    if (!seen.has(simplified) && simplified.length > 10) {
      seen.add(simplified);
      uniqueArticles.push(article);
    }
  }
  
  return uniqueArticles;
};

const extractKeyFacts = (content: string, headline: string): string => {
  if (!content || content.length < 30) {
    return cleanHeadlineForTLDR(headline);
  }
  
  // Clean and prepare content
  let cleanContent = content.trim();
  
  // Remove unwanted phrases
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleanContent = cleanContent.replace(regex, '');
  });
  
  // Remove promotional language
  cleanContent = cleanContent.replace(/\b(according to sources|reports suggest|it is believed)\b/gi, '');
  
  // Split into sentences and find the most informative ones
  const sentences = cleanContent.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    return sentence.length > 20 && 
           sentence.length < 200 &&
           sentence.split(' ').length >= 6 &&
           sentence.split(' ').length <= 35 &&
           !sentence.match(/^\s*(the|this|that|it|there|in|on|at)\s+/i) &&
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase()));
  });
  
  if (sentences.length === 0) {
    return cleanHeadlineForTLDR(headline);
  }
  
  // Prioritize sentences with numbers, names, or specific details
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // Bonus for numbers/statistics
    if (/\d+/.test(sentence)) score += 2;
    
    // Bonus for proper nouns (likely names/places)
    const words = sentence.split(' ');
    const capitalizedWords = words.filter(word => /^[A-Z][a-z]+/.test(word));
    score += Math.min(capitalizedWords.length, 3);
    
    // Bonus for action words
    const actionWords = ['announced', 'launched', 'arrested', 'elected', 'died', 'appointed', 'signed', 'approved', 'rejected'];
    if (actionWords.some(word => sentence.toLowerCase().includes(word))) score += 2;
    
    // Penalty for vague language
    const vagueWords = ['reportedly', 'allegedly', 'possibly', 'might', 'could'];
    if (vagueWords.some(word => sentence.toLowerCase().includes(word))) score -= 1;
    
    return { sentence, score };
  });
  
  // Sort by score and take the best sentence
  scoredSentences.sort((a, b) => b.score - a.score);
  let bestSentence = scoredSentences[0].sentence;
  
  // Ensure it starts with a capital letter
  bestSentence = bestSentence.charAt(0).toUpperCase() + bestSentence.slice(1);
  
  // Trim to ~50-60 words if too long
  const words = bestSentence.split(' ');
  if (words.length > 55) {
    bestSentence = words.slice(0, 50).join(' ') + '...';
  } else if (!bestSentence.endsWith('.')) {
    bestSentence += '.';
  }
  
  return bestSentence;
};

const cleanHeadlineForTLDR = (headline: string): string => {
  let cleaned = headline.trim();
  
  // Remove quotes if they wrap the entire headline
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove common headline prefixes
  cleaned = cleaned.replace(/^(Breaking:|BREAKING:|News:|UPDATE:)\s*/i, '');
  
  // If very long, intelligently truncate
  const words = cleaned.split(' ');
  if (words.length > 15) {
    // Find a good breaking point
    let breakPoint = 12;
    for (let i = 10; i < Math.min(15, words.length); i++) {
      if (words[i].match(/[.,:;]$/)) {
        breakPoint = i + 1;
        break;
      }
    }
    cleaned = words.slice(0, breakPoint).join(' ') + '...';
  }
  
  return cleaned + (cleaned.endsWith('.') ? '' : '.');
};

const generateImprovedTLDR = async (content: string, headline: string, description: string = ''): Promise<string> => {
  console.log(`Generating TL;DR using enhanced extraction for: "${headline}"`);
  
  const fullContent = `${description} ${content}`.trim();
  
  // Use enhanced fallback logic only - no AI
  return extractKeyFacts(fullContent, headline);
};

const searchForImages = async (query: string): Promise<string[]> => {
  try {
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
  if (originalUrl && originalUrl.includes('http')) {
    try {
      const response = await fetch(originalUrl, { method: 'HEAD' });
      if (response.ok) {
        return originalUrl;
      }
    } catch (error) {
      console.log('Original image not accessible, searching for alternative');
    }
  }
  
  const searchImages = await searchForImages(headline);
  
  if (searchImages.length > 0) {
    return searchImages[Math.floor(Math.random() * searchImages.length)];
  }
  
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
};

// Map country names to API country codes
const getCountryCode = (countryName: string): string => {
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
  
  return countryMap[countryName] || 'us';
};

const fetchNewsWithFallback = async (newsApiKey: string, newsDataApiKey: string, country: string, category: string): Promise<any[]> => {
  let allArticles: any[] = [];
  const countryCode = getCountryCode(country);
  
  console.log(`Fetching news for country: ${country} (code: ${countryCode})`);
  
  // Strategy 1: Try country-specific sources first
  if (countryCode !== 'us') {
    try {
      // Try NewsAPI with specific country
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=30&apiKey=${newsApiKey}`;
      console.log(`Calling NewsAPI for ${country}:`, newsApiUrl);
      
      const newsApiResponse = await fetch(newsApiUrl);
      const newsApiData = await newsApiResponse.json();
      
      if (newsApiData.articles && newsApiData.articles.length > 0) {
        console.log(`NewsAPI returned ${newsApiData.articles.length} articles for ${country}`);
        allArticles = allArticles.concat(newsApiData.articles);
      } else {
        console.log(`No articles from NewsAPI for ${country}`);
      }
      
      // Try NewsData.io with specific country
      const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&country=${countryCode}&language=en&size=20&image=1`;
      console.log(`Calling NewsData.io for ${country}:`, newsDataUrl);
      
      const newsDataResponse = await fetch(newsDataUrl);
      const newsDataData = await newsDataResponse.json();
      
      if (newsDataData.results && newsDataData.results.length > 0) {
        console.log(`NewsData.io returned ${newsDataData.results.length} articles for ${country}`);
        allArticles = allArticles.concat(newsDataData.results);
      } else {
        console.log(`No articles from NewsData.io for ${country}`);
      }
      
    } catch (error) {
      console.error(`Error fetching news for ${country}:`, error);
    }
  }
  
  // Strategy 2: If we don't have enough articles, try US sources as fallback
  if (allArticles.length < 10) {
    console.log(`Only ${allArticles.length} articles found for ${country}, trying US fallback`);
    
    try {
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=30&apiKey=${newsApiKey}`;
      console.log('Calling NewsAPI for US fallback:', newsApiUrl);
      
      const newsApiResponse = await fetch(newsApiUrl);
      const newsApiData = await newsApiResponse.json();
      
      if (newsApiData.articles && newsApiData.articles.length > 0) {
        console.log(`US NewsAPI returned ${newsApiData.articles.length} articles`);
        allArticles = allArticles.concat(newsApiData.articles);
      }
    } catch (error) {
      console.error('US NewsAPI failed:', error);
    }

    if (allArticles.length < 15) {
      try {
        const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&language=en&size=20&image=1`;
        console.log('Calling NewsData.io for global fallback');
        
        const newsDataResponse = await fetch(newsDataUrl);
        const newsDataData = await newsDataResponse.json();
        
        if (newsDataData.results && newsDataData.results.length > 0) {
          console.log(`Global NewsData.io returned ${newsDataData.results.length} articles`);
          allArticles = allArticles.concat(newsDataData.results);
        }
      } catch (error) {
        console.error('Global NewsData.io failed:', error);
      }
    }
  }

  console.log(`Total articles collected: ${allArticles.length}`);
  return allArticles;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, city, region, category = 'general', pageSize = 20 } = await req.json();
    
    console.log('Fetching location-specific news:', {
      country: country || 'Global',
      city: city || 'Unknown',
      region: region || 'Unknown',
      category,
      pageSize
    });

    const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
    const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';

    // Use the improved fetching strategy with proper country handling
    const allArticles = await fetchNewsWithFallback(newsApiKey, newsDataApiKey, country || 'United States', category);

    if (allArticles.length === 0) {
      console.log('No articles found, returning fallback news');
      // Return some fallback news instead of failing
      const fallbackNews = [{
        id: `news-fallback-${Date.now()}`,
        headline: 'News service temporarily unavailable',
        tldr: 'We are experiencing temporary issues with our news sources. Please try again in a few minutes.',
        quote: 'News will be available shortly',
        author: 'News Team',
        category: 'general',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '1 min read',
        publishedAt: new Date().toISOString(),
        sourceUrl: ''
      }];
      
      return new Response(
        JSON.stringify({ news: fallbackNews }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out low-quality articles
    const validArticles = allArticles.filter(isValidNewsArticle);
    console.log(`Filtered from ${allArticles.length} to ${validArticles.length} quality articles`);

    // Remove duplicates
    const uniqueArticles = removeDuplicates(validArticles);
    console.log(`Removed duplicates: ${uniqueArticles.length} unique articles remaining`);

    // Ensure we have at least some articles to work with
    const articlesToProcess = uniqueArticles.length > 0 ? uniqueArticles : allArticles.slice(0, Math.min(10, allArticles.length));

    // Transform articles to our format with enhanced summarization
    const transformedNews: NewsItem[] = await Promise.all(
      articlesToProcess.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.content || article.snippet || '';
        const description = article.description || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const articleCategory = article.category || category || 'General';
        
        // Generate enhanced TL;DR without AI
        const tldr = await generateImprovedTLDR(content, headline, description);
        
        // Get high-quality image
        const imageUrl = await getHighQualityImage(originalImage, headline);
        
        return {
          id: `news-${Date.now()}-${index}`,
          headline: headline,
          tldr: tldr,
          quote: (description || content).substring(0, 200) + ((description || content).length > 200 ? '...' : ''),
          author: article.author || article.source?.name || 'News Team',
          category: String(articleCategory),
          imageUrl: imageUrl,
          readTime: '2 min read',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || ''
        };
      })
    );

    console.log(`Returning ${transformedNews.length} location-specific news articles for ${country}`);

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
