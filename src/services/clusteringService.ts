
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
      // Use the clustering-helpers edge function
      const { data: clusters, error } = await supabase.functions.invoke('clustering-helpers', {
        body: { functionName: 'get_clusters_with_embeddings', args: {} }
      });
      
      if (error) {
        console.log('Clusters function not available, creating new cluster');
      }
      
      // For now, always create a new cluster since we can't access the table directly
      const clusterName = this.generateClusterName(keywords);
      
      // Use the edge function to create cluster
      const { data: newClusterResult, error: createError } = await supabase.functions.invoke('clustering-helpers', {
        body: {
          functionName: 'create_article_cluster',
          args: {
            cluster_name: clusterName,
            cluster_description: `Cluster for articles about ${keywords.slice(0, 3).join(', ')}`,
            centroid_data: embedding
          }
        }
      });
      
      if (createError) {
        console.error('Error creating cluster:', createError);
        return { clusterId: '', similarity: 0, isNewCluster: false };
      }
      
      if (newClusterResult?.data?.id) {
        return { clusterId: newClusterResult.data.id, similarity: 1.0, isNewCluster: true };
      }
      
      return { clusterId: '', similarity: 0, isNewCluster: false };
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
      
      // Use the edge function to update article with extracted features
      const { error } = await supabase.functions.invoke('clustering-helpers', {
        body: {
          functionName: 'update_article_features',
          args: {
            article_id: articleId,
            entities_data: entities,
            keywords_data: keywords,
            embedding_data: embedding,
            cluster_id_data: clusterResult.clusterId || null
          }
        }
      });
      
      if (error) {
        console.log(`Would update article ${articleId} with clustering data`);
        console.log('Entities:', entities.length);
        console.log('Keywords:', keywords.slice(0, 5));
        console.log('Cluster:', clusterResult.isNewCluster ? 'NEW' : 'EXISTING');
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
      // Use the edge function to get clustered articles
      const { data: result, error } = await supabase.functions.invoke('clustering-helpers', {
        body: {
          functionName: 'get_clustered_articles',
          args: {
            cluster_id: clusterId,
            exclude_id: excludeArticleId,
            article_limit: limit
          }
        }
      });
      
      if (error) {
        console.log('Clustering functions not available yet');
        return [];
      }
      
      return result?.data || [];
    } catch (error) {
      console.error('Error in getClusteredArticles:', error);
      return [];
    }
  }
}

export const clusteringService = new ClusteringService();
