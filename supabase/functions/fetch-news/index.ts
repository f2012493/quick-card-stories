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

const generateSmartFallback = (content: string, headline: string, description: string = ''): string => {
  console.log(`Generating smart fallback for: "${headline}"`);
  
  // Combine all available content
  const fullContent = `${description} ${content}`.trim();
  
  if (!fullContent || fullContent.length < 20) {
    // Extract key information from headline if no content
    return extractFromHeadline(headline);
  }

  // Clean content thoroughly
  let cleaned = fullContent.toLowerCase();
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Remove common filler words and phrases
  cleaned = cleaned.replace(/\b(according to|reports suggest|sources say|it is reported|officials said|experts believe)\b/gi, '');
  cleaned = cleaned.replace(/\b(in a statement|in an interview|during a press conference)\b/gi, '');
  
  // Split into sentences and find meaningful ones
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    return sentence.length > 15 && 
           sentence.split(' ').length >= 5 &&
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           !sentence.match(/^\s*(the|this|that|it|there)\s+/i); // Avoid sentences starting with weak words
  });

  if (sentences.length > 0) {
    // Take first meaningful sentence and enhance it
    let summary = sentences[0].trim();
    
    // Capitalize first letter
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    
    // Limit to reasonable length
    const words = summary.split(' ');
    if (words.length > 45) {
      summary = words.slice(0, 40).join(' ') + '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }
    
    return summary;
  }

  // Last resort - extract from headline
  return extractFromHeadline(headline);
};

const extractFromHeadline = (headline: string): string => {
  // Clean the headline and make it more descriptive
  let summary = headline.trim();
  
  // Remove quotes if they wrap the entire headline
  if (summary.startsWith('"') && summary.endsWith('"')) {
    summary = summary.slice(1, -1);
  }
  
  // If headline is too short, keep as is
  if (summary.split(' ').length <= 8) {
    return summary + (summary.endsWith('.') ? '' : '.');
  }
  
  // If headline is very long, truncate smartly
  const words = summary.split(' ');
  if (words.length > 15) {
    // Try to find a natural break point
    const firstPart = words.slice(0, 12).join(' ');
    return firstPart + (firstPart.endsWith('.') ? '' : '...');
  }
  
  return summary + (summary.endsWith('.') ? '' : '.');
};

const generateImprovedTLDR = async (content: string, headline: string, description: string = ''): Promise<string> => {
  console.log(`Generating improved TL;DR for: "${headline}"`);
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  // Combine all available content for better context
  const fullContent = `${description} ${content}`.trim();
  
  if (openAIApiKey && fullContent.length > 20) {
    try {
      // Clean the content first
      let cleanContent = fullContent;
      unwantedPhrases.forEach(phrase => {
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleanContent = cleanContent.replace(regex, '');
      });

      const prompt = `Create a clear, factual summary in exactly 2-3 sentences (maximum 60 words) for this news story:

HEADLINE: ${headline}
CONTENT: ${cleanContent.substring(0, 500)}

Requirements:
- 2-3 complete sentences only
- Maximum 60 words total
- Focus on WHO, WHAT, WHEN, WHERE
- Be specific about actual facts and numbers
- Avoid generic phrases like "development" or "situation"
- Start with the most important fact`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a news summarization expert. Create precise, factual summaries that capture the essence of the story in minimal words. Never use generic phrases.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 80
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiSummary = data.choices[0].message.content.trim();
        
        if (aiSummary.length > 10 && aiSummary.split(' ').length <= 65) {
          console.log(`AI-generated TL;DR: "${aiSummary}"`);
          return aiSummary;
        }
      } else {
        console.error('OpenAI API error:', await response.text());
      }
    } catch (error) {
      console.error('AI summarization failed:', error);
    }
  }
  
  // Use improved fallback
  return generateSmartFallback(fullContent, headline, description);
};

const generateBetterFallback = (content: string, headline: string): string => {
  if (!content || content.length < 20) {
    // If we have no content, create a simple summary from headline
    const words = headline.split(' ').slice(0, 12);
    return words.join(' ') + (words.length < headline.split(' ').length ? '...' : '');
  }

  // Clean content
  let cleaned = content.trim();
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Extract first meaningful sentences
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    return sentence.length > 20 && 
           sentence.split(' ').length >= 4 &&
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase()));
  });

  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    const words = firstSentence.split(' ');
    
    // Limit to about 40-50 words for the fallback
    if (words.length <= 50) {
      return firstSentence + '.';
    } else {
      return words.slice(0, 45).join(' ') + '...';
    }
  }

  // Last resort - use first part of content
  const words = cleaned.split(' ').slice(0, 30);
  return words.join(' ') + (words.length === 30 ? '...' : '');
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, city, region, category = 'general', pageSize = 20 } = await req.json();
    
    console.log('Fetching news with enhanced summarization:', {
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

    // Transform articles to our format with enhanced summarization
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.content || article.snippet || '';
        const description = article.description || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const articleCategory = article.category || category || 'General';
        
        // Generate enhanced TL;DR with better fallback
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

    console.log(`Returning ${transformedNews.length} news articles with enhanced summaries`);

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
