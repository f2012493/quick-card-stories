
import { supabase } from '@/integrations/supabase/client';

interface NamedEntity {
  text: string;
  label: string;
  confidence: number;
}

interface ClusterResult {
  clusterId: string;
  similarity: number;
  isNewCluster: boolean;
}

class ClusteringService {
  // Simple NER implementation using regex patterns and keyword matching
  extractNamedEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];
    
    // Person names (capitalized words, common titles)
    const personPattern = /\b(?:Mr|Mrs|Ms|Dr|Prof|President|Minister|PM|CEO|Director)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const personMatches = text.match(personPattern);
    if (personMatches) {
      personMatches.forEach(match => {
        entities.push({ text: match.trim(), label: 'PERSON', confidence: 0.8 });
      });
    }
    
    // Organizations (companies, institutions)
    const orgPattern = /\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\s+(?:Ltd|Limited|Corp|Corporation|Inc|Company|Group|Bank|Authority|Commission|Ministry|Department|University|Institute|Agency|Association)\b/g;
    const orgMatches = text.match(orgPattern);
    if (orgMatches) {
      orgMatches.forEach(match => {
        entities.push({ text: match.trim(), label: 'ORG', confidence: 0.7 });
      });
    }
    
    // Locations (cities, countries, states)
    const locationKeywords = [
      'India', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
      'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Rajasthan', 'Punjab',
      'United States', 'USA', 'China', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal',
      'New York', 'London', 'Tokyo', 'Singapore', 'Dubai', 'Hong Kong'
    ];
    
    locationKeywords.forEach(location => {
      const regex = new RegExp(`\\b${location}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          entities.push({ text: match, label: 'GPE', confidence: 0.9 });
        });
      }
    });
    
    // Money and numbers
    const moneyPattern = /\b(?:Rs|₹|USD|\$|EUR|€)\s*[\d,]+(?:\.\d+)?(?:\s*(?:crore|lakh|million|billion|thousand))?\b/gi;
    const moneyMatches = text.match(moneyPattern);
    if (moneyMatches) {
      moneyMatches.forEach(match => {
        entities.push({ text: match.trim(), label: 'MONEY', confidence: 0.8 });
      });
    }
    
    return entities;
  }
  
  // Extract keywords using TF-IDF approach
  extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    // Clean and tokenize text
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count word frequencies
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  // Simple embedding generation using word frequency vectors
  generateEmbedding(text: string): number[] {
    const keywords = this.extractKeywords(text);
    const entities = this.extractNamedEntities(text);
    
    // Create a simple 384-dimensional embedding based on content features
    const embedding = new Array(384).fill(0);
    
    // Use keyword frequencies for first part of embedding
    keywords.forEach((keyword, index) => {
      const freq = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      if (index < 100) {
        embedding[index] = freq / text.length;
      }
    });
    
    // Use entity types for middle part
    const entityTypes = ['PERSON', 'ORG', 'GPE', 'MONEY'];
    entityTypes.forEach((type, index) => {
      const count = entities.filter(e => e.label === type).length;
      if (index < 50) {
        embedding[100 + index] = count / Math.max(entities.length, 1);
      }
    });
    
    // Use text features for remaining dimensions
    const textLength = Math.min(text.length / 1000, 1); // Normalized text length
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const avgSentenceLength = text.length / Math.max(sentenceCount, 1);
    
    embedding[200] = textLength;
    embedding[201] = sentenceCount / 100;
    embedding[202] = avgSentenceLength / 1000;
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }
  
  // Calculate cosine similarity between two embeddings
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }
  
  // Find or create cluster for an article
  async findOrCreateCluster(embedding: number[], keywords: string[], threshold: number = 0.7): Promise<ClusterResult> {
    try {
      // Find existing clusters
      const { data: clusters, error } = await supabase
        .from('article_clusters')
        .select('id, name, centroid_embedding')
        .not('centroid_embedding', 'is', null);
      
      if (error) {
        console.error('Error fetching clusters:', error);
        return { clusterId: '', similarity: 0, isNewCluster: false };
      }
      
      let bestMatch: { clusterId: string; similarity: number } | null = null;
      
      // Find best matching cluster
      if (clusters && clusters.length > 0) {
        for (const cluster of clusters) {
          if (cluster.centroid_embedding) {
            const centroidArray = Array.isArray(cluster.centroid_embedding) 
              ? cluster.centroid_embedding 
              : JSON.parse(cluster.centroid_embedding);
            
            const similarity = this.cosineSimilarity(embedding, centroidArray);
            
            if (similarity > threshold && (!bestMatch || similarity > bestMatch.similarity)) {
              bestMatch = { clusterId: cluster.id, similarity };
            }
          }
        }
      }
      
      // Return existing cluster if found
      if (bestMatch) {
        return { ...bestMatch, isNewCluster: false };
      }
      
      // Create new cluster
      const clusterName = this.generateClusterName(keywords);
      const { data: newCluster, error: createError } = await supabase
        .from('article_clusters')
        .insert({
          name: clusterName,
          description: `Cluster for articles about ${keywords.slice(0, 3).join(', ')}`,
          centroid_embedding: embedding,
          article_count: 1
        })
        .select('id')
        .single();
      
      if (createError || !newCluster) {
        console.error('Error creating cluster:', createError);
        return { clusterId: '', similarity: 0, isNewCluster: false };
      }
      
      return { clusterId: newCluster.id, similarity: 1.0, isNewCluster: true };
    } catch (error) {
      console.error('Error in findOrCreateCluster:', error);
      return { clusterId: '', similarity: 0, isNewCluster: false };
    }
  }
  
  // Generate cluster name from keywords
  generateClusterName(keywords: string[]): string {
    const topKeywords = keywords.slice(0, 3);
    return topKeywords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' & ');
  }
  
  // Process article for NER, keywords, and clustering
  async processArticle(articleId: string, title: string, content: string, description?: string): Promise<void> {
    try {
      const fullText = `${title} ${description || ''} ${content || ''}`;
      
      // Extract features
      const entities = this.extractNamedEntities(fullText);
      const keywords = this.extractKeywords(fullText);
      const embedding = this.generateEmbedding(fullText);
      
      // Find or create cluster
      const clusterResult = await this.findOrCreateCluster(embedding, keywords);
      
      // Update article with extracted features
      const { error } = await supabase
        .from('articles')
        .update({
          named_entities: entities,
          keywords,
          topic_embedding: embedding,
          cluster_id: clusterResult.clusterId || null
        })
        .eq('id', articleId);
      
      if (error) {
        console.error('Error updating article:', error);
      } else {
        console.log(`Processed article ${articleId} - Cluster: ${clusterResult.isNewCluster ? 'NEW' : 'EXISTING'}`);
      }
    } catch (error) {
      console.error('Error processing article:', error);
    }
  }
  
  // Get articles in the same cluster
  async getClusteredArticles(clusterId: string, excludeArticleId?: string, limit: number = 5): Promise<any[]> {
    try {
      let query = supabase
        .from('articles')
        .select('id, title, description, image_url, published_at, author')
        .eq('cluster_id', clusterId)
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (excludeArticleId) {
        query = query.neq('id', excludeArticleId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching clustered articles:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getClusteredArticles:', error);
      return [];
    }
  }
}

export const clusteringService = new ClusteringService();
