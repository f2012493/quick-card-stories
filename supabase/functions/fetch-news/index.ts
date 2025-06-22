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

// Enhanced country mapping with more countries
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
    'Brazil': 'br',
    'Italy': 'it',
    'Spain': 'es',
    'Russia': 'ru',
    'South Korea': 'kr',
    'Mexico': 'mx',
    'Argentina': 'ar',
    'Netherlands': 'nl',
    'Belgium': 'be',
    'Sweden': 'se',
    'Norway': 'no',
    'Denmark': 'dk',
    'Finland': 'fi',
    'Poland': 'pl',
    'Turkey': 'tr',
    'South Africa': 'za',
    'Egypt': 'eg',
    'Israel': 'il',
    'UAE': 'ae',
    'Saudi Arabia': 'sa',
    'Thailand': 'th',
    'Indonesia': 'id',
    'Malaysia': 'my',
    'Singapore': 'sg',
    'Philippines': 'ph',
    'Vietnam': 'vn',
    'Bangladesh': 'bd',
    'Pakistan': 'pk',
    'Sri Lanka': 'lk',
    'Nepal': 'np'
  };
  
  return countryMap[countryName] || 'us';
};

// New API integrations for better international coverage
const fetchFromNewsAPI = async (apiKey: string, country: string, category: string): Promise<any[]> => {
  try {
    const countryCode = getCountryCode(country);
    const url = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=30&apiKey=${apiKey}`;
    console.log(`Calling NewsAPI for ${country}:`, url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      console.log(`NewsAPI returned ${data.articles.length} articles for ${country}`);
      return data.articles;
    }
    
    console.log(`No articles from NewsAPI for ${country}`);
    return [];
  } catch (error) {
    console.error(`NewsAPI error for ${country}:`, error);
    return [];
  }
};

const fetchFromNewsDataIO = async (apiKey: string, country: string): Promise<any[]> => {
  try {
    const countryCode = getCountryCode(country);
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&country=${countryCode}&language=en&size=20&image=1`;
    console.log(`Calling NewsData.io for ${country}:`, url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      console.log(`NewsData.io returned ${data.results.length} articles for ${country}`);
      return data.results;
    }
    
    console.log(`No articles from NewsData.io for ${country}`);
    return [];
  } catch (error) {
    console.error(`NewsData.io error for ${country}:`, error);
    return [];
  }
};

// New GNews API integration (free tier)
const fetchFromGNews = async (country: string, category: string): Promise<any[]> => {
  try {
    const countryCode = getCountryCode(country);
    // GNews API - free tier with good international coverage
    const url = `https://gnews.io/api/v4/top-headlines?country=${countryCode}&category=${category}&lang=en&max=20&apikey=YOUR_GNEWS_API_KEY`;
    console.log(`Trying GNews for ${country}`);
    
    // For now, we'll skip GNews as it requires API key
    // but keeping the structure for future implementation
    return [];
  } catch (error) {
    console.error(`GNews error for ${country}:`, error);
    return [];
  }
};

// New RSS feed integration for Indian news sources
const fetchFromRSSFeeds = async (country: string): Promise<any[]> => {
  if (country !== 'India') return [];
  
  try {
    console.log('Fetching from Indian RSS feeds');
    
    // Using RSS2JSON service for Indian news sources
    const indianSources = [
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://www.hindustantimes.com/feeds/rss/india-news/index.xml',
      'https://www.ndtv.com/rss/india',
      'https://indianexpress.com/section/india/feed/'
    ];
    
    const articles: any[] = [];
    
    for (const rssUrl of indianSources.slice(0, 2)) { // Limit to 2 sources to avoid timeout
      try {
        const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=YOUR_RSS2JSON_KEY&count=10`;
        
        // For demonstration, using free RSS2JSON service
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=5`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          console.log(`RSS feed returned ${data.items.length} articles from ${rssUrl}`);
          articles.push(...data.items.map((item: any) => ({
            title: item.title,
            description: item.description,
            content: item.content || item.description,
            url: item.link,
            urlToImage: item.enclosure?.link || item.thumbnail,
            publishedAt: item.pubDate,
            source: { name: 'Indian News' },
            author: item.author || 'Indian News'
          })));
        }
      } catch (rssError) {
        console.log(`RSS feed error for ${rssUrl}:`, rssError);
      }
    }
    
    console.log(`Total RSS articles collected: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error('RSS feeds error:', error);
    return [];
  }
};

// Guardian API integration (free tier)
const fetchFromGuardian = async (country: string): Promise<any[]> => {
  try {
    let query = 'world';
    if (country === 'India') {
      query = 'india';
    } else if (country === 'United States') {
      query = 'us-news';
    } else if (country === 'United Kingdom') {
      query = 'uk-news';
    }
    
    // Guardian API - free tier
    const url = `https://content.guardianapis.com/search?q=${query}&show-fields=thumbnail,trailText&page-size=15&api-key=test`;
    console.log(`Calling Guardian API for ${country} with query: ${query}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response?.results && data.response.results.length > 0) {
      console.log(`Guardian API returned ${data.response.results.length} articles for ${country}`);
      return data.response.results.map((article: any) => ({
        title: article.webTitle,
        description: article.fields?.trailText || '',
        content: article.fields?.trailText || '',
        url: article.webUrl,
        urlToImage: article.fields?.thumbnail,
        publishedAt: article.webPublicationDate,
        source: { name: 'The Guardian' },
        author: 'The Guardian'
      }));
    }
    
    console.log(`No articles from Guardian API for ${country}`);
    return [];
  } catch (error) {
    console.error(`Guardian API error for ${country}:`, error);
    return [];
  }
};

const fetchNewsWithEnhancedSources = async (newsApiKey: string, newsDataApiKey: string, country: string, category: string): Promise<any[]> => {
  let allArticles: any[] = [];
  
  console.log(`Fetching enhanced news sources for: ${country}`);
  
  // Strategy 1: Try country-specific sources
  const fetchPromises = [
    fetchFromNewsAPI(newsApiKey, country, category),
    fetchFromNewsDataIO(newsDataApiKey, country),
    fetchFromGuardian(country),
    fetchFromRSSFeeds(country)
  ];
  
  try {
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles = allArticles.concat(result.value);
        const sourceNames = ['NewsAPI', 'NewsData.io', 'Guardian', 'RSS Feeds'];
        console.log(`${sourceNames[index]} contributed ${result.value.length} articles`);
      }
    });
    
  } catch (error) {
    console.error('Error fetching from multiple sources:', error);
  }
  
  // Strategy 2: If still not enough articles, try global sources
  if (allArticles.length < 5) {
    console.log(`Only ${allArticles.length} articles found for ${country}, trying global sources`);
    
    try {
      // Try US sources as fallback
      const usSources = await Promise.allSettled([
        fetchFromNewsAPI(newsApiKey, 'United States', category),
        fetchFromGuardian('United States')
      ]);
      
      usSources.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allArticles = allArticles.concat(result.value);
        }
      });
      
    } catch (error) {
      console.error('Error fetching global fallback:', error);
    }
  }
  
  console.log(`Total articles collected from all sources: ${allArticles.length}`);
  return allArticles;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, city, region, category = 'general', pageSize = 20 } = await req.json();
    
    console.log('Fetching location-specific news with enhanced sources:', {
      country: country || 'Global',
      city: city || 'Unknown',
      region: region || 'Unknown',
      category,
      pageSize
    });

    const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
    const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';

    // Use the enhanced fetching strategy with multiple sources
    const allArticles = await fetchNewsWithEnhancedSources(newsApiKey, newsDataApiKey, country || 'United States', category);

    if (allArticles.length === 0) {
      console.log('No articles found from any source, returning fallback news');
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
        const headline = article.title || article.headline || article.webTitle || 'Breaking News';
        const content = article.content || article.snippet || '';
        const description = article.description || article.fields?.trailText || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || article.fields?.thumbnail || '';
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
          publishedAt: article.publishedAt || article.pubDate || article.webPublicationDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || article.webUrl || ''
        };
      })
    );

    console.log(`Returning ${transformedNews.length} enhanced location-specific news articles for ${country}`);

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
