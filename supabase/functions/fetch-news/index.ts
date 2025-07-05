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
  'significant development',
  'mobile app',
  'onelink.to',
  'youtube',
  'download app',
  'app store',
  'google play',
  'breaking-news',
  'n180c_',
  '_indian18oc_',
  'desc-youtube'
];

const cleanGarbageText = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove URLs and app links
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s]+/gi, '');
  
  // Remove app-related garbage
  cleaned = cleaned.replace(/n180c_[^-]*-?/gi, '');
  cleaned = cleaned.replace(/_indian18oc_[^-]*-?/gi, '');
  cleaned = cleaned.replace(/breaking-newsNews\d+/gi, '');
  cleaned = cleaned.replace(/Mobile App - [^"]+/gi, '');
  cleaned = cleaned.replace(/desc-youtube/gi, '');
  cleaned = cleaned.replace(/onelink\.to\/[^\s]*/gi, '');
  
  // Remove garbage patterns
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Clean up remaining artifacts
  cleaned = cleaned.replace(/[-_]{2,}/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/^[-\s]+|[-\s]+$/g, '');
  
  return cleaned;
};

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatTLDR = (text: string): string => {
  if (!text) return text;
  
  let cleanedText = cleanGarbageText(text);
  if (!cleanedText) return text;
  
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
  const cleanedContent = cleanGarbageText(fullContent);
  
  if (!cleanedContent || cleanedContent.length < 20) {
    return formatTLDR(extractFromHeadline(headline));
  }

  let cleaned = cleanedContent.toLowerCase();
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
  let summary = cleanGarbageText(headline.trim());
  
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
  
  const fullContent = `${description} ${content}`.trim();
  const cleanedContent = cleanGarbageText(fullContent);
  
  if (cleanedContent.length > 20) {
    return generateSmartFallback(cleanedContent, headline, description);
  }
  
  return generateSmartFallback(cleanedContent, headline, description);
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
    const { country, city, region, category = 'general', pageSize = 30 } = await req.json();
    
    console.log('Fetching diverse news sources:', {
      country: country || 'Global',
      city: city || 'Unknown',
      region: region || 'Unknown',
      category,
      pageSize
    });

    const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
    const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';

    let articles: any[] = [];

    // Try multiple sources in parallel for diversity
    const fetchPromises = [];

    // NewsAPI - US and India
    if (newsApiKey) {
      const usNewsPromise = fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=10&apiKey=${newsApiKey}`)
        .then(res => res.json())
        .then(data => ({ source: 'NewsAPI-US', articles: data.articles || [] }))
        .catch(err => ({ source: 'NewsAPI-US', articles: [], error: err }));
      
      const inNewsPromise = fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=10&apiKey=${newsApiKey}`)
        .then(res => res.json())
        .then(data => ({ source: 'NewsAPI-IN', articles: data.articles || [] }))
        .catch(err => ({ source: 'NewsAPI-IN', articles: [], error: err }));
      
      fetchPromises.push(usNewsPromise, inNewsPromise);
    }

    // NewsData.io - Multiple countries
    if (newsDataApiKey) {
      const newsDataPromise = fetch(`https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&country=us,in,gb,au,ca&language=en&size=15&image=1`)
        .then(res => res.json())
        .then(data => ({ source: 'NewsData', articles: data.results || [] }))
        .catch(err => ({ source: 'NewsData', articles: [], error: err }));
      
      fetchPromises.push(newsDataPromise);
    }

    // Fetch from multiple RSS feeds for diversity
    const rssPromises = [
      // BBC RSS
      fetch('https://feeds.bbci.co.uk/news/rss.xml')
        .then(res => res.text())
        .then(text => ({ source: 'BBC', rss: text }))
        .catch(err => ({ source: 'BBC', error: err })),
      
      // CNN RSS
      fetch('https://rss.cnn.com/rss/edition.rss')
        .then(res => res.text())
        .then(text => ({ source: 'CNN', rss: text }))
        .catch(err => ({ source: 'CNN', error: err })),
      
      // Reuters RSS
      fetch('https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best')
        .then(res => res.text())
        .then(text => ({ source: 'Reuters', rss: text }))
        .catch(err => ({ source: 'Reuters', error: err }))
    ];

    fetchPromises.push(...rssPromises);

    const results = await Promise.allSettled(fetchPromises);
    
    // Process API results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        if (data.articles && Array.isArray(data.articles)) {
          console.log(`${data.source} provided ${data.articles.length} articles`);
          articles = articles.concat(data.articles.slice(0, 8));
        } else if (data.rss && typeof data.rss === 'string') {
          // Parse RSS
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.rss, 'text/xml');
            const items = doc.querySelectorAll('item');
            
            const rssArticles = Array.from(items).slice(0, 6).map(item => ({
              title: item.querySelector('title')?.textContent || 'News Update',
              description: item.querySelector('description')?.textContent || '',
              url: item.querySelector('link')?.textContent || '',
              source: { name: data.source },
              urlToImage: item.querySelector('media\\:content, enclosure')?.getAttribute('url') || '',
              publishedAt: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
              author: data.source
            }));
            
            console.log(`${data.source} RSS provided ${rssArticles.length} articles`);
            articles = articles.concat(rssArticles);
          } catch (rssError) {
            console.error(`Failed to parse RSS from ${data.source}:`, rssError);
          }
        }
      }
    });

    if (articles.length === 0) {
      throw new Error('No articles found from any news source');
    }

    console.log(`Total articles collected: ${articles.length}`);

    const locationString = city && country ? `${city}, ${country}` : country || '';

    // Transform articles with better cleaning
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = cleanGarbageText(article.title || article.headline || 'Breaking News');
        const content = cleanGarbageText(article.content || article.snippet || '');
        const description = cleanGarbageText(article.description || '');
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const sourceName = article.source?.name || article.author || 'News Source';
        
        // Generate clean TL;DR
        const tldr = await generateTLDR(content, headline, description);
        
        // Clean quote
        const cleanQuote = cleanGarbageText((description || content).substring(0, 200));
        const finalQuote = cleanQuote + (cleanQuote.length >= 200 ? '...' : '');
        
        // Use original image or contextual placeholder
        const imageUrl = originalImage || getContextualPlaceholder(headline, description);
        
        return {
          id: `news-${Date.now()}-${index}`,
          headline: headline,
          tldr: tldr,
          quote: finalQuote,
          author: sourceName,
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

    console.log(`Returning ${transformedNews.length} cleaned news articles from diverse sources`);

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
