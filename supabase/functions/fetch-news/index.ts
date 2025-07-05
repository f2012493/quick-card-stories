
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cleanGarbageText } from './utils/textCleaning.ts';
import { generateTLDR } from './utils/contentGeneration.ts';
import { getContextualPlaceholder } from './utils/imageHandling.ts';
import { calculateTrustScore, calculateLocalRelevance } from './utils/scoring.ts';
import { parseRSSFeed } from './utils/rssParser.ts';

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

    // Enhanced RSS feeds with more Indian sources
    const rssPromises = [
      // International sources
      fetch('https://feeds.bbci.co.uk/news/rss.xml')
        .then(res => res.text())
        .then(text => ({ source: 'BBC', rss: text }))
        .catch(err => ({ source: 'BBC', error: err })),
      
      fetch('https://rss.cnn.com/rss/edition.rss')
        .then(res => res.text())
        .then(text => ({ source: 'CNN', rss: text }))
        .catch(err => ({ source: 'CNN', error: err })),
      
      fetch('https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best')
        .then(res => res.text())
        .then(text => ({ source: 'Reuters', rss: text }))
        .catch(err => ({ source: 'Reuters', error: err })),

      // Indian news sources
      fetch('https://www.news18.com/rss/india.xml')
        .then(res => res.text())
        .then(text => ({ source: 'News18', rss: text }))
        .catch(err => ({ source: 'News18', error: err })),

      fetch('https://timesofindia.indiatimes.com/rssfeedstopstories.cms')
        .then(res => res.text())
        .then(text => ({ source: 'Times of India', rss: text }))
        .catch(err => ({ source: 'Times of India', error: err })),

      fetch('https://www.ndtv.com/rss/latest')
        .then(res => res.text())
        .then(text => ({ source: 'NDTV', rss: text }))
        .catch(err => ({ source: 'NDTV', error: err })),

      fetch('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml')
        .then(res => res.text())
        .then(text => ({ source: 'Hindustan Times', rss: text }))
        .catch(err => ({ source: 'Hindustan Times', error: err })),

      fetch('https://economictimes.indiatimes.com/rssfeedstopstories.cms')
        .then(res => res.text())
        .then(text => ({ source: 'Economic Times', rss: text }))
        .catch(err => ({ source: 'Economic Times', error: err })),

      fetch('https://www.indiatoday.in/rss/1206578')
        .then(res => res.text())
        .then(text => ({ source: 'India Today', rss: text }))
        .catch(err => ({ source: 'India Today', error: err })),

      fetch('https://www.deccanherald.com/rss/national.rss')
        .then(res => res.text())
        .then(text => ({ source: 'Deccan Herald', rss: text }))
        .catch(err => ({ source: 'Deccan Herald', error: err })),

      fetch('https://www.thehindu.com/news/national/feeder/default.rss')
        .then(res => res.text())
        .then(text => ({ source: 'The Hindu', rss: text }))
        .catch(err => ({ source: 'The Hindu', error: err })),

      fetch('https://indianexpress.com/section/india/feed/')
        .then(res => res.text())
        .then(text => ({ source: 'Indian Express', rss: text }))
        .catch(err => ({ source: 'Indian Express', error: err })),

      fetch('https://www.livemint.com/rss/news')
        .then(res => res.text())
        .then(text => ({ source: 'LiveMint', rss: text }))
        .catch(err => ({ source: 'LiveMint', error: err })),

      fetch('https://www.moneycontrol.com/rss/latestnews.xml')
        .then(res => res.text())
        .then(text => ({ source: 'MoneyControl', rss: text }))
        .catch(err => ({ source: 'MoneyControl', error: err })),

      fetch('https://www.business-standard.com/rss/latest.rss')
        .then(res => res.text())
        .then(text => ({ source: 'Business Standard', rss: text }))
        .catch(err => ({ source: 'Business Standard', error: err }))
    ];

    fetchPromises.push(...rssPromises);

    const results = await Promise.allSettled(fetchPromises);
    
    // Process API results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        if (data.articles && Array.isArray(data.articles)) {
          console.log(`${data.source} provided ${data.articles.length} articles`);
          articles = articles.concat(data.articles.slice(0, 6));
        } else if (data.rss && typeof data.rss === 'string') {
          // Parse RSS
          try {
            const rssArticles = parseRSSFeed(data.rss, data.source);
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

    console.log(`Total articles collected from ${results.length} sources: ${articles.length}`);

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

    console.log(`Returning ${transformedNews.length} cleaned news articles from diverse Indian and international sources`);

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
