
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  title: string;
  content: string;
  description: string;
  url: string;
  image_url: string;
  author: string;
  published_at: string;
  category: string;
  source: {
    name: string;
    domain: string;
    trust_score: number;
  };
}

interface NewsFilters {
  category?: string;
  limit?: number;
  offset?: number;
  country?: string;
  city?: string;
  region?: string;
}

export class NewsService {
  async getArticles(filters: NewsFilters = {}): Promise<Article[]> {
    try {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          description,
          url,
          image_url,
          author,
          published_at,
          category,
          news_sources!articles_source_id_fkey (
            name,
            domain,
            trust_score
          )
        `)
        .eq('status', 'active')
        .order('published_at', { ascending: false });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      return data.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content || '',
        description: article.description || '',
        url: article.url,
        image_url: article.image_url || '',
        author: article.author || '',
        published_at: article.published_at,
        category: article.category || 'general',
        source: {
          name: article.news_sources?.name || 'Unknown',
          domain: article.news_sources?.domain || '',
          trust_score: article.news_sources?.trust_score || 0.5
        }
      }));
    } catch (error) {
      console.error('Error in getArticles:', error);
      throw error;
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          description,
          url,
          image_url,
          author,
          published_at,
          category,
          news_sources!articles_source_id_fkey (
            name,
            domain,
            trust_score
          )
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content || '',
        description: data.description || '',
        url: data.url,
        image_url: data.image_url || '',
        author: data.author || '',
        published_at: data.published_at,
        category: data.category || 'general',
        source: {
          name: data.news_sources?.name || 'Unknown',
          domain: data.news_sources?.domain || '',
          trust_score: data.news_sources?.trust_score || 0.5
        }
      };
    } catch (error) {
      console.error('Error in getArticleById:', error);
      return null;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      const categories = [...new Set(data.map(item => item.category))];
      return categories.filter(Boolean);
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }
}

export const newsService = new NewsService();
