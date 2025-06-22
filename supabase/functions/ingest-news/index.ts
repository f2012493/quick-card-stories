
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const generateEmbedding = async (text: string): Promise<number[]> => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.log('No OpenAI API key, returning zero embedding');
    return new Array(1536).fill(0);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000), // Limit input length
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data[0].embedding;
    }
  } catch (error) {
    console.error('Error generating embedding:', error);
  }

  return new Array(1536).fill(0);
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

    // Generate embeddings
    const titleEmbedding = await generateEmbedding(article.title);
    const contentEmbedding = await generateEmbedding(
      (article.content || article.description || article.title).substring(0, 2000)
    );

    // Calculate quality score
    const qualityScore = calculateQualityScore(article);

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
        content_hash: btoa(article.title + article.url) // Simple hash for deduplication
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
