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
  contextualInsights?: string[];
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

const generateInsightfulAnalysis = async (content: string, headline: string, description: string = '', location?: string): Promise<{ tldr: string; insights: string[] }> => {
  console.log(`Generating insightful analysis for: "${headline}"`);
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  const fullContent = `${description} ${content}`.trim();
  
  if (openAIApiKey && fullContent.length > 20) {
    try {
      let cleanContent = fullContent;
      unwantedPhrases.forEach(phrase => {
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleanContent = cleanContent.replace(regex, '');
      });

      const locationContext = location ? `considering the local context of ${location}` : '';

      const prompt = `You are a news analyst focused on making complex events understandable. Analyze this news story and provide:

1. A clear, factual summary (2-3 sentences, max 60 words)
2. 2-3 contextual insights explaining WHY this matters and what it means for people's lives

HEADLINE: ${headline}
CONTENT: ${cleanContent.substring(0, 800)}
${locationContext}

Requirements:
- Summary: Focus on WHO, WHAT, WHEN, WHERE with specific facts
- Insights: Explain the deeper significance, implications, and connections to broader trends
- Be specific about actual impact on people's daily lives
- Avoid generic phrases like "situation" or "development"
- Use proper capitalization and grammar

Format your response as:
SUMMARY: [your 2-3 sentence summary]
INSIGHTS:
- [insight 1]
- [insight 2]
- [insight 3]`;

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
              content: 'You are an expert news analyst who helps people understand the deeper meaning behind current events. Focus on clarity, context, and real-world implications.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const analysis = data.choices[0].message.content.trim();
        
        const summaryMatch = analysis.match(/SUMMARY:\s*(.+?)(?=INSIGHTS:|$)/s);
        const insightsMatch = analysis.match(/INSIGHTS:\s*(.+)/s);
        
        let tldr = '';
        let insights: string[] = [];
        
        if (summaryMatch) {
          tldr = summaryMatch[1].trim();
        }
        
        if (insightsMatch) {
          insights = insightsMatch[1]
            .split('\n')
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(line => line.length > 10);
        }
        
        if (tldr.length > 10 && insights.length > 0) {
          console.log(`AI-generated analysis - TL;DR: "${tldr}", Insights: ${insights.length}`);
          return { tldr, insights };
        }
      } else {
        console.error('OpenAI API error:', await response.text());
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
  }
  
  // Fallback analysis
  return {
    tldr: generateSmartFallback(fullContent, headline, description),
    insights: generateBasicInsights(headline, fullContent)
  };
};

const generateBasicInsights = (headline: string, content: string): string[] => {
  const insights: string[] = [];
  const text = `${headline} ${content}`.toLowerCase();
  
  if (text.includes('economy') || text.includes('market') || text.includes('job') || text.includes('business')) {
    insights.push('Economic implications may affect local employment and business opportunities');
  }
  
  if (text.includes('policy') || text.includes('government') || text.includes('law') || text.includes('regulation')) {
    insights.push('Policy changes could impact citizen services and community governance');
  }
  
  if (text.includes('technology') || text.includes('digital') || text.includes('ai') || text.includes('innovation')) {
    insights.push('Technology developments may reshape how we work and interact daily');
  }
  
  if (text.includes('climate') || text.includes('environment') || text.includes('energy') || text.includes('green')) {
    insights.push('Environmental factors influence long-term community planning and lifestyle');
  }
  
  if (text.includes('health') || text.includes('medical') || text.includes('hospital') || text.includes('disease')) {
    insights.push('Health developments affect community wellbeing and healthcare access');
  }
  
  return insights.slice(0, 3);
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
    
    console.log('Fetching news with enhanced analysis:', {
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

    // Transform articles with enhanced analysis
    const transformedNews: NewsItem[] = await Promise.all(
      articles.slice(0, pageSize).map(async (article, index) => {
        const headline = article.title || article.headline || 'Breaking News';
        const content = article.content || article.snippet || '';
        const description = article.description || '';
        const originalImage = article.urlToImage || article.image_url || article.imageUrl || '';
        const articleCategory = article.category || category || 'General';
        const sourceName = article.source?.name || 'News Source';
        
        // Generate enhanced analysis with insights
        const analysis = await generateInsightfulAnalysis(content, headline, description, locationString);
        
        // Get high-quality image
        const imageUrl = await getHighQualityImage(originalImage, headline);
        
        return {
          id: `news-${Date.now()}-${index}`,
          headline: headline,
          tldr: analysis.tldr,
          quote: (description || content).substring(0, 200) + ((description || content).length > 200 ? '...' : ''),
          author: article.author || sourceName,
          category: String(articleCategory),
          imageUrl: imageUrl,
          readTime: '2 min read',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          sourceUrl: article.url || article.link || '',
          trustScore: calculateTrustScore(sourceName),
          localRelevance: calculateLocalRelevance(headline, description, locationString),
          contextualInsights: analysis.insights
        };
      })
    );

    console.log(`Returning ${transformedNews.length} news articles with enhanced analysis`);

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
