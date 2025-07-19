import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cleanGarbageText } from './utils/textCleaning.ts';
import { generateTLDR } from './utils/contentGeneration.ts';
import { getContextualPlaceholder } from './utils/imageHandling.ts';
import { calculateTrustScore, calculateLocalRelevance } from './utils/scoring.ts';
import { parseRSSFeed } from './utils/rssParser.ts';
import { extractFullContent } from './utils/contentExtraction.ts';
import { analyzeNewsStory } from './utils/perplexityAnalysis.ts';

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

// Enhanced RSS feed fetcher with CORS proxy fallback
async function fetchRSSWithFallback(url: string, sourceName: string, timeout = 15000): Promise<any[]> {
  const corsProxies = [
    '', // Direct fetch first
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
  ];
  
  for (let i = 0; i < corsProxies.length; i++) {
    const proxyUrl = corsProxies[i] + encodeURIComponent(url);
    const fetchUrl = i === 0 ? url : proxyUrl;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`Trying ${sourceName} with ${i === 0 ? 'direct fetch' : `proxy ${i}`}`);
      
      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0; +http://www.example.com/bot)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`${sourceName} failed with status ${response.status} using ${i === 0 ? 'direct' : 'proxy'}`);
        continue;
      }
      
      let text;
      if (i === 1) { // allorigins proxy
        const data = await response.json();
        text = data.contents;
      } else {
        text = await response.text();
      }
      
      if (!text || text.length < 100) {
        console.warn(`${sourceName} returned empty or too short content`);
        continue;
      }
      
      const articles = parseRSSFeed(text, sourceName);
      if (articles.length > 0) {
        console.log(`${sourceName} successfully fetched ${articles.length} articles`);
        return articles;
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`${sourceName} failed with ${i === 0 ? 'direct' : `proxy ${i}`}:`, error.message);
    }
  }
  
  console.error(`All methods failed for ${sourceName}`);
  return [];
}

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

    // Enhanced RSS feeds with better error handling and CORS proxies
    const rssPromises = [
      // International sources
      fetchRSSWithFallback('https://feeds.bbci.co.uk/news/rss.xml', 'BBC'),
      fetchRSSWithFallback('https://rss.cnn.com/rss/edition.rss', 'CNN'),
      fetchRSSWithFallback('https://feeds.reuters.com/reuters/topNews', 'Reuters'),

      // Indian news sources with enhanced error handling and CORS proxy fallback
      fetchRSSWithFallback('https://www.news18.com/rss/india.xml', 'News18'),
      fetchRSSWithFallback('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Times of India'),
      fetchRSSWithFallback('https://www.ndtv.com/rss/latest', 'NDTV'),
      fetchRSSWithFallback('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'Hindustan Times'),
      fetchRSSWithFallback('https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'Economic Times'),
      fetchRSSWithFallback('https://www.indiatoday.in/rss/1206578', 'India Today'),
      fetchRSSWithFallback('https://www.deccanherald.com/rss/national.rss', 'Deccan Herald'),
      fetchRSSWithFallback('https://www.thehindu.com/news/national/feeder/default.rss', 'The Hindu'),
      fetchRSSWithFallback('https://indianexpress.com/section/india/feed/', 'Indian Express'),
      fetchRSSWithFallback('https://www.livemint.com/rss/news', 'LiveMint'),
      fetchRSSWithFallback('https://www.moneycontrol.com/rss/latestnews.xml', 'MoneyControl'),
      fetchRSSWithFallback('https://www.business-standard.com/rss/latest.rss', 'Business Standard')
    ];

    // Execute all API calls
    const apiResults = await Promise.allSettled(fetchPromises);
    
    // Process API results
    apiResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        if (data.articles && Array.isArray(data.articles)) {
          console.log(`${data.source} provided ${data.articles.length} articles`);
          articles = articles.concat(data.articles.slice(0, 6));
        }
      }
    });

    // Execute RSS calls
    const rssResults = await Promise.allSettled(rssPromises);
    
    // Process RSS results
    rssResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && Array.isArray(result.value)) {
        const rssArticles = result.value;
        if (rssArticles.length > 0) {
          console.log(`RSS source ${index + 1} provided ${rssArticles.length} articles`);
          articles = articles.concat(rssArticles);
        }
      }
    });

    if (articles.length === 0) {
      console.warn('No articles found from any news source, returning empty array');
      return new Response(
        JSON.stringify({ news: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Total articles collected: ${articles.length}`);

    const locationString = city && country ? `${city}, ${country}` : country || '';

    // Transform articles with full content extraction
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = cleanGarbageText(article.title || article.headline || 'Breaking News');
        const content = cleanGarbageText(article.content || article.snippet || '');
        const description = cleanGarbageText(article.description || '');
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const sourceName = article.source?.name || article.author || 'News Source';
        const sourceUrl = article.url || article.link || article.sourceUrl || article.webUrl || '';
        
        // Extract full article content
        let fullContent = content || description;
        if (sourceUrl && fullContent.length < 500) {
          try {
            const extractedContent = await extractFullContent(sourceUrl, sourceName);
            if (extractedContent.length > fullContent.length) {
              fullContent = extractedContent;
            }
          } catch (error) {
            console.warn(`Failed to extract full content for ${headline}:`, error);
          }
        }
        
        // Generate clean TL;DR
        const tldr = await generateTLDR(fullContent, headline, description);
        
        // Clean quote
        const cleanQuote = cleanGarbageText((description || fullContent).substring(0, 200));
        const finalQuote = cleanQuote + (cleanQuote.length >= 200 ? '...' : '');
        
        // Use original image or contextual placeholder
        const imageUrl = originalImage || getContextualPlaceholder(headline, description);
        
        // Analyze the story using Perplexity API
        console.log(`Analyzing story: ${headline.substring(0, 50)}...`);
        const analysis = await analyzeNewsStory(headline, fullContent, description);
        
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
          sourceUrl: sourceUrl,
          trustScore: calculateTrustScore(sourceName),
          localRelevance: calculateLocalRelevance(headline, description, locationString),
          fullContent: fullContent, // Add full content for carousel display
          storyBreakdown: analysis.breakdown,
          storyNature: analysis.storyNature,
          analysisConfidence: analysis.confidence
        };
      })
    );

    console.log(`Returning ${transformedNews.length} cleaned news articles with full content`);

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
