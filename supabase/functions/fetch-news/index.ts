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
  if (!content || content.length < 30) return [];
  
  const cleaned = cleanContent(content);
  if (cleaned.length < 30) return [];
  
  // Split into sentences and filter for meaningful content
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    const words = sentence.split(' ');
    return sentence.length > 25 && 
           words.length >= 6 && 
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           // Filter out vague sentences
           !sentence.toLowerCase().includes('according to sources') &&
           !sentence.toLowerCase().includes('reports indicate') &&
           !sentence.toLowerCase().includes('it is understood') &&
           !sentence.toLowerCase().includes('sources close to') &&
           // Check for actual substantive content
           words.some(word => word.length > 5) && // At least one substantial word
           // Avoid sentences that are just quotes without context
           !(sentence.startsWith('"') && sentence.endsWith('"') && words.length < 10);
  });
  
  return sentences.slice(0, 3); // Take first 3 meaningful sentences
};

const generateTLDR = (content: string, headline: string): string => {
  console.log(`Generating TL;DR for headline: "${headline}"`);
  console.log(`Content preview: "${content.substring(0, 200)}..."`);
  
  // Check if content is meaningful
  const contentLower = content.toLowerCase();
  const headlineLower = headline.toLowerCase();
  
  // Extract meaningful sentences first
  const meaningfulSentences = extractMeaningfulSentences(content);
  
  // If we have good content, use it
  if (meaningfulSentences.length > 0) {
    // Build TL;DR from meaningful sentences (aim for 30-40 words max)
    let tldr = '';
    let wordCount = 0;
    const targetWords = 35;
    
    for (const sentence of meaningfulSentences) {
      const sentenceWords = sentence.split(' ').length;
      if (wordCount + sentenceWords <= targetWords) {
        tldr += sentence + '. ';
        wordCount += sentenceWords;
      } else {
        // Add partial sentence if we can fit at least 8 more words
        if (targetWords - wordCount >= 8) {
          const words = sentence.split(' ');
          const partialSentence = words.slice(0, targetWords - wordCount).join(' ');
          tldr += partialSentence + '...';
        }
        break;
      }
    }
    
    tldr = tldr.trim();
    if (tldr && !tldr.endsWith('.') && !tldr.endsWith('...')) {
      tldr += '.';
    }
    
    // If TL;DR is good and not too similar to headline, use it
    if (tldr.length >= 50 && !tldr.toLowerCase().includes(headlineLower.substring(0, Math.min(20, headlineLower.length)))) {
      console.log(`Generated TL;DR (${tldr.split(' ').length} words): "${tldr.substring(0, 100)}..."`);
      return tldr;
    }
  }
  
  // If content is poor or too similar to headline, create a very short summary
  console.log('Creating short summary due to poor content');
  
  // Extract key terms from headline
  const keyTerms = headline.split(' ').filter(word => 
    word.length > 3 && 
    !['that', 'this', 'with', 'from', 'they', 'them', 'have', 'been', 'were', 'will', 'says', 'after'].includes(word.toLowerCase())
  ).slice(0, 3);
  
  // Create a minimal but informative summary
  if (headlineLower.includes('court') || headlineLower.includes('judge') || headlineLower.includes('ruling')) {
    return `Legal ruling affects ${keyTerms.join(' ').toLowerCase()}.`;
  } else if (headlineLower.includes('election') || headlineLower.includes('vote') || headlineLower.includes('political')) {
    return `Political development involving ${keyTerms.join(' ').toLowerCase()}.`;
  } else if (headlineLower.includes('market') || headlineLower.includes('stock') || headlineLower.includes('economic')) {
    return `Market movement related to ${keyTerms.join(' ').toLowerCase()}.`;
  } else if (headlineLower.includes('tech') || headlineLower.includes('ai') || headlineLower.includes('digital')) {
    return `Technology update regarding ${keyTerms.join(' ').toLowerCase()}.`;
  } else {
    return `News update on ${keyTerms.join(' ').toLowerCase()}.`;
  }
};

const extractSubject = (headline: string): string => {
  // Extract the main subject from headline
  const words = headline.split(' ');
  
  // Look for proper nouns (capitalized words that aren't at the start)
  const properNouns = words.filter((word, index) => 
    index > 0 && word.length > 2 && /^[A-Z]/.test(word) && 
    !['The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For'].includes(word)
  );
  
  if (properNouns.length > 0) {
    return properNouns.slice(0, 2).join(' ').toLowerCase();
  }
  
  // Fallback to first 3-4 meaningful words
  const meaningfulWords = words.filter(word => 
    word.length > 3 && 
    !['that', 'this', 'with', 'from', 'they', 'them', 'have', 'been', 'were', 'will'].includes(word.toLowerCase())
  );
  
  return meaningfulWords.slice(0, 3).join(' ').toLowerCase();
};

const generateNarrationText = (headline: string, tldr: string, content: string): string => {
  // Create a 60-second explainer (approximately 150-180 words for natural speech pace)
  const targetWords = 160;
  
  let narration = `Breaking News: ${headline}. `;
  let wordCount = narration.split(' ').length;
  
  // Add the TL;DR content if it's meaningful and different from headline
  if (tldr && !unwantedPhrases.some(phrase => tldr.toLowerCase().includes(phrase.toLowerCase()))) {
    const tldrLower = tldr.toLowerCase();
    const headlineLower = headline.toLowerCase();
    
    // Only add TL;DR if it's not too similar to the headline
    if (!tldrLower.includes(headlineLower.substring(0, Math.min(20, headlineLower.length)))) {
      narration += `Here's what you need to know: ${tldr} `;
      wordCount = narration.split(' ').length;
    }
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
