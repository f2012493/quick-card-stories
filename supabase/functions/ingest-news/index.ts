
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple 60-word TLDR generation function
const generateTLDR = (content: string, headline: string, description: string = ''): string => {
  const text = content || description || headline || '';
  
  // Clean and normalize text
  const cleanText = text
    .replace(/[^\w\s.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanText) return 'Summary not available';
  
  // Split into words and limit to 60
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length <= 60) {
    return cleanText.endsWith('.') ? cleanText : cleanText + '.';
  }
  
  // Take first 60 words and ensure proper ending
  const limitedWords = words.slice(0, 60);
  let summary = limitedWords.join(' ');
  
  // Find last sentence boundary within our limit
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > summary.length * 0.7) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary = summary.replace(/[.!?]+$/, '') + '.';
  }
  
  return summary;
};

// Import Perplexity analysis utility
const analyzeNewsStory = async (headline: string, content: string, description: string = '') => {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.warn('Perplexity API key not found, using fallback analysis');
    return { storyNature: 'other', breakdown: '', confidence: 0.0 };
  }

  try {
    const fullText = `${headline}\n\n${description}\n\n${content}`.trim();
    
    // Analyze story nature and generate breakdown
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a news analysis expert. Analyze the story nature and provide a simple breakdown that helps readers understand complex news.'
          },
          {
            role: 'user',
            content: `Analyze this news story:

Title: ${headline}
Content: ${fullText.substring(0, 1500)}

1. Classify the story nature (choose one): policy_change, scandal, court_judgement, political_move, economic_development, technology_advancement, health_development, environmental_issue, security_incident, international_relations, social_issue, other

2. Provide a simple breakdown (under 300 words) that explains:
   - What happened in simple terms
   - Why it matters to ordinary people
   - What might happen next

Format your response as:
NATURE: [category]
BREAKDOWN: [explanation]`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      const natureMatch = content.match(/NATURE:\s*([^\n]+)/);
      const breakdownMatch = content.match(/BREAKDOWN:\s*([\s\S]+)/);
      
      return {
        storyNature: natureMatch ? natureMatch[1].trim().toLowerCase() : 'other',
        breakdown: breakdownMatch ? breakdownMatch[1].trim() : '',
        confidence: 0.9
      };
    }
  } catch (error) {
    console.error('Perplexity analysis error:', error);
  }
  
  return { storyNature: 'other', breakdown: '', confidence: 0.0 };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  title: string;
  content?: string;
  description?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  source: string;
  category?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const generateSimpleEmbedding = (text: string): number[] => {
  // Simple hash-based embedding as fallback
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const embedding = new Array(1536).fill(0);
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pos = hash % 1536;
    embedding[pos] = Math.min(1, embedding[pos] + 0.1);
  });
  
  return embedding;
};

const calculateQualityScore = (article: Article): number => {
  let score = 0.5; // Base score

  // Check for clickbait indicators
  const clickbaitWords = ['shocking', 'unbelievable', 'you won\'t believe', 'amazing', 'incredible'];
  const titleLower = article.title.toLowerCase();
  const hasClickbait = clickbaitWords.some(word => titleLower.includes(word));
  
  if (hasClickbait) score -= 0.2;
  if (article.title.includes('?') && article.title.length < 50) score -= 0.1;
  if (article.content && article.content.length > 500) score += 0.2;
  if (article.author) score += 0.1;

  return Math.max(0, Math.min(1, score));
};

const fetchNewsFromAPI = async (): Promise<Article[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY');
  const articles: Article[] = [];

  if (newsApiKey) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=50&apiKey=${newsApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const article of data.articles || []) {
          if (article.title && article.url) {
            articles.push({
              title: article.title,
              content: article.content,
              description: article.description,
              url: article.url,
              imageUrl: article.urlToImage,
              author: article.author,
              publishedAt: article.publishedAt,
              source: article.source?.name || 'Unknown',
              category: 'general'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error);
    }
  }

  return articles;
};

const storeArticle = async (article: Article) => {
  try {
    console.log(`Analyzing article: ${article.title.substring(0, 50)}...`);
    
    // Analyze the article using Perplexity API
    const analysis = await analyzeNewsStory(
      article.title,
      article.content || '',
      article.description || ''
    );
    
    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('url', article.url)
      .single();

    if (existing) {
      console.log(`Article already exists: ${article.title}`);
      return null;
    }

    // Get or create news source
    let { data: source } = await supabase
      .from('news_sources')
      .select('id, trust_score')
      .eq('name', article.source)
      .single();

    if (!source) {
      const domain = new URL(article.url).hostname;
      const { data: newSource } = await supabase
        .from('news_sources')
        .insert({
          name: article.source,
          domain: domain,
          trust_score: 0.5,
          trust_level: 'medium'
        })
        .select('id, trust_score')
        .single();
      
      source = newSource;
    }

    // Generate simple embeddings instead of OpenAI
    const titleEmbedding = generateSimpleEmbedding(article.title);
    const contentEmbedding = generateSimpleEmbedding(
      (article.content || article.description || article.title).substring(0, 2000)
    );

    // Calculate quality score
    const qualityScore = calculateQualityScore(article);

    // Generate 60-word TLDR
    const tldr = await generateTLDR(
      article.content || '', 
      article.title, 
      article.description || ''
    );

    // Store article
    const { data: storedArticle, error } = await supabase
      .from('articles')
      .insert({
        source_id: source?.id,
        title: article.title,
        content: article.content,
        description: article.description,
        url: article.url,
        image_url: article.imageUrl,
        author: article.author,
        published_at: article.publishedAt,
        category: article.category,
        title_embedding: titleEmbedding,
        content_embedding: contentEmbedding,
        quality_score: qualityScore,
        content_hash: btoa(article.title + article.url), // Simple hash for deduplication
        story_breakdown: analysis.breakdown,
        story_nature: analysis.storyNature,
        analysis_confidence: analysis.confidence,
        tldr: tldr
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing article:', error);
      return null;
    }

    console.log(`Stored article: ${article.title}`);
    return storedArticle;
  } catch (error) {
    console.error('Error in storeArticle:', error);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting news ingestion...');
    
    // Fetch articles from external APIs
    const articles = await fetchNewsFromAPI();
    console.log(`Fetched ${articles.length} articles from external sources`);

    // Store articles in database
    const storedArticles = [];
    for (const article of articles) {
      const stored = await storeArticle(article);
      if (stored) storedArticles.push(stored);
    }

    console.log(`Successfully ingested ${storedArticles.length} new articles`);

    // Trigger clustering function
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cluster-articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger: 'ingest' })
      });
    } catch (error) {
      console.error('Error triggering clustering:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ingested: storedArticles.length,
        total_fetched: articles.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ingest-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
