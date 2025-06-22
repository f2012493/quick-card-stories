
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
  videoUrl?: string;
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
  'being closely monitored'
];

const extractKeyFacts = (content: string, headline: string): string[] => {
  if (!content || content.length < 30) return [];
  
  // Clean content first
  let cleaned = content.trim();
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Split into sentences and analyze for facts
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    const words = sentence.split(' ');
    return sentence.length > 20 && 
           words.length >= 5 && 
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           // Look for factual indicators
           (sentence.includes('said') || sentence.includes('announced') || 
            sentence.includes('reported') || sentence.includes('confirmed') ||
            sentence.match(/\d+/) || // Contains numbers
            sentence.includes('will') || sentence.includes('has') || sentence.includes('have'));
  });
  
  // Score sentences by factual content
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // Higher score for specific entities
    if (/[A-Z][a-z]+\s[A-Z][a-z]+/.test(sentence)) score += 2; // Names
    if (/\$\d+|£\d+|€\d+|\d+%|\d+\s?(million|billion|thousand)/.test(sentence)) score += 3; // Numbers/money
    if (/(said|announced|confirmed|reported|stated|revealed)/.test(sentence)) score += 2; // Attribution
    if (/(will|plans to|expected to|scheduled to)/.test(sentence)) score += 1; // Future actions
    if (sentence.includes(headline.split(' ')[0])) score += 1; // Related to headline
    
    return { sentence, score };
  });
  
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);
};

const generateImprovedTLDR = async (content: string, headline: string): Promise<string> => {
  console.log(`Generating improved TL;DR for: "${headline}"`);
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    // Fallback to basic extraction
    return generateBasicTLDR(content, headline);
  }

  try {
    const keyFacts = extractKeyFacts(content, headline);
    const contextContent = keyFacts.length > 0 ? keyFacts.join(' ') : content.substring(0, 300);
    
    const prompt = `Create a concise 25-word summary for this news story:

HEADLINE: ${headline}
CONTENT: ${contextContent}

Requirements:
- Exactly 25 words or fewer
- Focus on the most important fact or outcome
- Avoid generic phrases like "development" or "situation"
- Be specific about what actually happened
- Start with the key action or result`;

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
            content: 'You are a news summarization expert. Create precise, factual summaries that capture the essence of the story in minimal words.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiSummary = data.choices[0].message.content.trim();
      
      if (aiSummary.length > 5 && aiSummary.split(' ').length <= 30) {
        console.log(`AI-generated TL;DR: "${aiSummary}"`);
        return aiSummary;
      }
    }
  } catch (error) {
    console.error('AI summarization failed:', error);
  }
  
  // Fallback to improved basic extraction
  return generateBasicTLDR(content, headline);
};

const generateBasicTLDR = (content: string, headline: string): string => {
  const keyFacts = extractKeyFacts(content, headline);
  
  if (keyFacts.length > 0) {
    // Use the highest-scoring fact and truncate to ~25 words
    const bestFact = keyFacts[0];
    const words = bestFact.split(' ');
    if (words.length <= 25) {
      return bestFact + '.';
    } else {
      return words.slice(0, 22).join(' ') + '...';
    }
  }
  
  // Ultra-short fallback
  const keyTerms = headline.split(' ').filter(word => 
    word.length > 3 && 
    !['that', 'this', 'with', 'from', 'they', 'them', 'have', 'been', 'were', 'will', 'says', 'after'].includes(word.toLowerCase())
  ).slice(0, 3);
  
  return `Key development involving ${keyTerms.join(' ').toLowerCase()}.`;
};

const generateVideoFromNews = async (headline: string, summary: string): Promise<string> => {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log('No OpenAI key available for video generation');
      return getPlaceholderVideo();
    }

    // Generate a video prompt
    const prompt = `Create a 30-second video script for this news story: "${headline}". Summary: ${summary}. 
    
    Make it engaging and visual, focusing on the key facts. Describe specific scenes, text overlays, and visual elements that would work well in a short vertical video format.`;

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
            content: 'You are a video content creator specializing in news videos for social media. Create engaging, factual video scripts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Generated video script for:', headline);
      
      // For now, return a placeholder video URL
      // In a real implementation, you'd send this script to a video generation service
      return getPlaceholderVideo();
    }
  } catch (error) {
    console.error('Video generation failed:', error);
  }
  
  return getPlaceholderVideo();
};

const getPlaceholderVideo = (): string => {
  // Return a placeholder video URL - in production you'd use actual video generation
  const videoIds = [
    'dQw4w9WgXcQ', // Sample video IDs for demo
    'ScMzIvxBSi4',
    'ZbZSe6N_BXs',
    'ePpPVE-GGJw',
    'mN3z3eSVG7A'
  ];
  
  const randomId = videoIds[Math.floor(Math.random() * videoIds.length)];
  return `https://www.youtube.com/embed/${randomId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1`;
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
    
    console.log('Fetching news with enhanced summarization and video generation:', {
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

    // Transform articles to our format with enhanced summarization and video generation
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.description || article.content || article.snippet || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        
        // Generate enhanced TL;DR with AI
        const tldr = await generateImprovedTLDR(content, headline);
        
        // Generate video for the news story
        const videoUrl = await generateVideoFromNews(headline, tldr);
        
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
          readTime: '30 sec video',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || '',
          videoUrl: videoUrl
        };
      })
    );

    console.log(`Returning ${transformedNews.length} news articles with enhanced summaries and videos`);

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
