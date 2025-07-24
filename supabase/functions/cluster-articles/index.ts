
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Calculate scoring factors for a cluster
const calculateClusterScores = async (clusterId: string) => {
  try {
    // Get cluster articles with source trust scores
    const { data: articles } = await supabase
      .from('cluster_articles')
      .select(`
        article_id,
        articles!inner(
          published_at,
          quality_score,
          news_sources!inner(trust_score)
        )
      `)
      .eq('cluster_id', clusterId);

    if (!articles || articles.length === 0) return null;

    const articleData = articles.map(a => a.articles).filter(Boolean);
    const now = new Date();

    // 1. Freshness Score (based on most recent article)
    const latestPublished = new Date(Math.max(...articleData.map(a => new Date(a.published_at).getTime())));
    const hoursOld = (now.getTime() - latestPublished.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 1 - (hoursOld / 48)); // Decay over 48 hours

    // 2. Newsworthiness Score (based on number of sources)
    const sourceCount = new Set(articleData.map(a => a.news_sources.trust_score)).size;
    const newsworthinessScore = Math.min(1, sourceCount / 5); // Max at 5 sources

    // 3. Authority Score (average source trust)
    const avgTrustScore = articleData.reduce((sum, a) => sum + a.news_sources.trust_score, 0) / articleData.length;

    // 4. Originality Score (based on earliest article)
    const earliestPublished = new Date(Math.min(...articleData.map(a => new Date(a.published_at).getTime())));
    const originalityHours = (now.getTime() - earliestPublished.getTime()) / (1000 * 60 * 60);
    const originalityScore = originalityHours <= 6 ? 1 : Math.max(0, 1 - (originalityHours - 6) / 18); // Bonus for breaking news

    // 5. Quality Score (average article quality)
    const avgQualityScore = articleData.reduce((sum, a) => sum + (a.quality_score || 0.5), 0) / articleData.length;

    // Calculate base score (weighted combination)
    const baseScore = (
      freshnessScore * 0.25 +
      newsworthinessScore * 0.20 +
      avgTrustScore * 0.20 +
      originalityScore * 0.15 +
      avgQualityScore * 0.20
    ) * 100; // Scale to 0-100

    // Update cluster with scores
    await supabase
      .from('story_clusters')
      .update({
        freshness_score: Math.round(freshnessScore * 100) / 100,
        newsworthiness_score: Math.round(newsworthinessScore * 100) / 100,
        authority_score: Math.round(avgTrustScore * 100) / 100,
        originality_score: Math.round(originalityScore * 100) / 100,
        quality_score: Math.round(avgQualityScore * 100) / 100,
        base_score: Math.round(baseScore * 100) / 100,
        article_count: articleData.length,
        earliest_published_at: earliestPublished.toISOString(),
        latest_published_at: latestPublished.toISOString(),
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      .eq('id', clusterId);

    return { baseScore, articleCount: articleData.length };
  } catch (error) {
    console.error('Error calculating cluster scores:', error);
    return null;
  }
};

// Find or create cluster for an article
const findOrCreateCluster = async (article: any): Promise<string | null> => {
  try {
    const titleEmbedding = article.title_embedding;
    if (!titleEmbedding || titleEmbedding.length === 0) return null;

    // Find similar clusters using title similarity
    const { data: existingClusters } = await supabase
      .from('story_clusters')
      .select('id, title, description')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    let bestMatch = null;
    let bestSimilarity = 0;

    // Check similarity with existing clusters (simplified - in production, use vector similarity)
    for (const cluster of existingClusters || []) {
      const titleSimilarity = calculateTitleSimilarity(article.title, cluster.title);
      if (titleSimilarity > 0.7 && titleSimilarity > bestSimilarity) {
        bestMatch = cluster;
        bestSimilarity = titleSimilarity;
      }
    }

    if (bestMatch) {
      // Add to existing cluster
      await supabase
        .from('cluster_articles')
        .insert({
          cluster_id: bestMatch.id,
          article_id: article.id,
          similarity_score: Math.round(bestSimilarity * 100) / 100
        });
      
      console.log(`Added article to existing cluster: ${bestMatch.title}`);
      return bestMatch.id;
    } else {
      // Create new cluster
      const { data: newCluster } = await supabase
        .from('story_clusters')
        .insert({
          title: article.title,
          description: article.description || article.title,
          category: article.category || 'general',
          representative_image_url: article.image_url
        })
        .select('id')
        .single();

      if (newCluster) {
        await supabase
          .from('cluster_articles')
          .insert({
            cluster_id: newCluster.id,
            article_id: article.id,
            similarity_score: 1.0,
            is_representative: true
          });

        console.log(`Created new cluster: ${article.title}`);
        return newCluster.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in findOrCreateCluster:', error);
    return null;
  }
};

// Simple title similarity check (in production, use embeddings)
const calculateTitleSimilarity = (title1: string, title2: string): number => {
  const words1 = title1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = title2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  const intersection = words1.filter(w => words2.includes(w));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting article clustering...');

    // Get unprocessed articles (not in any cluster)
    const { data: unclusteredArticles } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'active')
      .not('id', 'in', 
        supabase
          .from('cluster_articles')
          .select('article_id')
      )
      .limit(100);

    console.log(`Found ${unclusteredArticles?.length || 0} unclustered articles`);

    const processedClusters = new Set<string>();

    // Process each unclustered article
    for (const article of unclusteredArticles || []) {
      const clusterId = await findOrCreateCluster(article);
      if (clusterId) {
        processedClusters.add(clusterId);
      }
    }

    // Recalculate scores for all affected clusters
    for (const clusterId of processedClusters) {
      await calculateClusterScores(clusterId);
    }

    // Clean up stale clusters
    await supabase
      .from('story_clusters')
      .update({ status: 'stale' })
      .lt('expires_at', new Date().toISOString());

    console.log(`Processed ${processedClusters.size} clusters`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_articles: unclusteredArticles?.length || 0,
        updated_clusters: processedClusters.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cluster-articles function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
