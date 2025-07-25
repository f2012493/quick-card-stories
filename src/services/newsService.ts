
import { supabase } from '@/integrations/supabase/client';
import { generateGenZTldr } from '@/utils/genZTone';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
  trustScore?: number;
  localRelevance?: number;
  clusterId?: string;
  contextualInsights?: string[];
  fullContent?: string;
  storyBreakdown?: string;
  storyNature?: string;
  analysisConfidence?: number;
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
}

class NewsService {
  async fetchAllNews(): Promise<NewsItem[]> {
    try {
      console.log('Fetching news from database...');
      
      // First, get articles with their source information
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          *,
          news_sources!articles_source_id_fkey (
            name,
            trust_score
          ),
          cluster_articles!cluster_articles_article_id_fkey (
            cluster_id
          )
        `)
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      if (!articles || articles.length === 0) {
        console.log('No articles found in database');
        return [];
      }

      console.log(`Found ${articles.length} articles in database`);

      // Transform the data to match our interface
      const transformedNews: NewsItem[] = articles.map(article => {
        // Handle the source data safely
        const source = article.news_sources;
        const sourceName = source?.name || 'Unknown Source';
        const sourceTrustScore = source?.trust_score || 0.5;
        
        // Handle cluster data
        const clusterData = article.cluster_articles?.[0];
        const clusterId = clusterData?.cluster_id || undefined;

        // Calculate estimated read time based on content length
        const wordCount = article.content ? article.content.split(' ').length : 100;
        const readTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed
        const readTime = `${readTimeMinutes} min read`;

        return {
          id: article.id,
          headline: article.title,
          tldr: generateGenZTldr(article.content, article.title) || article.description || 'No summary available',
          quote: this.extractQuote(article.content),
          author: article.author || sourceName,
          imageUrl: article.image_url || '/placeholder.svg',
          readTime,
          publishedAt: article.published_at,
          sourceUrl: article.url,
          trustScore: sourceTrustScore,
          localRelevance: article.local_relevance_score || 0,
          clusterId,
          contextualInsights: this.generateContextualInsights(article),
          fullContent: article.content,
          storyBreakdown: article.story_breakdown,
          storyNature: article.story_nature,
          analysisConfidence: article.analysis_confidence,
          contextualInfo: {
            topic: article.category || 'General',
            backgroundInfo: this.generateBackgroundInfo(article),
            keyFacts: this.extractKeyFacts(article.content),
            relatedConcepts: this.generateRelatedConcepts(article)
          }
        };
      });

      return transformedNews;

    } catch (error) {
      console.error('Error in fetchAllNews:', error);
      throw error;
    }
  }

  private generateTldr(content: string | null): string {
    if (!content) return 'Summary not available';
    
    // Clean up HTML entities, artifacts, and unwanted patterns
    let cleanContent = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\[.*?\]/g, '') // Remove [+ chars], [+n chars] type artifacts
      .replace(/\[\+\d+\s*chars?\]/gi, '') // Specifically target [+n chars]
      .replace(/\d+\s*$/, '') // Remove trailing numbers like "0"
      .replace(/^\d+\s*/, '') // Remove leading numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove common prefixes/suffixes that might be artifacts
    cleanContent = cleanContent
      .replace(/^(summary|tldr|description):\s*/i, '')
      .replace(/\.\.\.\s*$/, '')
      .replace(/…\s*$/, '');
    
    // Split into words and limit to 60 words
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return 'Summary not available';
    }
    
    if (words.length <= 60) {
      // Ensure proper ending
      if (!cleanContent.match(/[.!?]$/)) {
        return cleanContent + '.';
      }
      return cleanContent;
    }
    
    // Take first 60 words and ensure proper sentence ending
    const limitedWords = words.slice(0, 60);
    let summary = limitedWords.join(' ');
    
    // Find last complete sentence within the limit
    const lastSentenceEnd = Math.max(
      summary.lastIndexOf('.'),
      summary.lastIndexOf('!'),
      summary.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > summary.length * 0.7) {
      // If we have a sentence that ends reasonably close to our limit, use that
      summary = summary.substring(0, lastSentenceEnd + 1);
    } else {
      // Otherwise, add ellipsis
      if (!summary.match(/[.!?]$/)) {
        summary += '...';
      }
    }
    
    return summary;
  }

  private extractQuote(content: string | null): string {
    if (!content) return '';
    
    // Look for quoted text
    const quoteMatch = content.match(/"([^"]{20,100})"/);
    if (quoteMatch) {
      return `"${quoteMatch[1]}"`;
    }
    
    // Fallback to extracting a meaningful sentence
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.length > 1 ? sentences[1].trim() : '';
  }

  private generateContextualInsights(article: any): string[] {
    const insights: string[] = [];
    
    if (article.trust_score > 0.8) {
      insights.push('High credibility source');
    }
    
    if (article.local_relevance_score > 0.7) {
      insights.push('High local relevance');
    }
    
    if (article.story_nature && article.story_nature !== 'general') {
      insights.push(`Story type: ${article.story_nature.replace('_', ' ')}`);
    }
    
    if (article.analysis_confidence > 0.8) {
      insights.push('AI-enhanced analysis available');
    }
    
    return insights;
  }

  private generateBackgroundInfo(article: any): string[] {
    const info: string[] = [];
    
    if (article.category) {
      info.push(`Category: ${article.category}`);
    }
    
    if (article.author) {
      info.push(`Reported by: ${article.author}`);
    }
    
    const publishedDate = new Date(article.published_at).toLocaleDateString();
    info.push(`Published: ${publishedDate}`);
    
    return info;
  }

  private extractKeyFacts(content: string | null): string[] {
    if (!content) return [];
    
    // Simple fact extraction - look for sentences with numbers, names, or specific patterns
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const facts = sentences
      .filter(sentence => 
        /\d+/.test(sentence) || // Contains numbers
        /[A-Z][a-z]+ [A-Z][a-z]+/.test(sentence) || // Contains proper names
        /(said|announced|reported|confirmed)/i.test(sentence) // Contains reporting verbs
      )
      .slice(0, 3)
      .map(fact => fact.trim());
    
    return facts;
  }

  private generateRelatedConcepts(article: any): string[] {
    const concepts: string[] = [];
    
    if (article.category) {
      concepts.push(article.category);
    }
    
    // Extract concepts from title
    const titleWords = article.title.toLowerCase().split(' ')
      .filter((word: string) => word.length > 4)
      .slice(0, 2);
    concepts.push(...titleWords);
    
    return concepts.filter((concept, index) => concepts.indexOf(concept) === index);
  }
}

export const newsService = new NewsService();
