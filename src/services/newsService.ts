
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

class NewsService {
  async fetchAllNews(): Promise<NewsItem[]> {
    try {
      console.log('Fetching news from database...');
      
      // Get basic articles
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          tldr,
          description,
          author,
          image_url,
          content,
          published_at,
          url,
          news_sources!articles_source_id_fkey (
            name
          )
        `)
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(50);

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
        const source = article.news_sources;
        const sourceName = source?.name || 'Unknown Source';

        // Calculate estimated read time based on content length
        const wordCount = article.content ? article.content.split(' ').length : 100;
        const readTimeMinutes = Math.ceil(wordCount / 200);
        const readTime = `${readTimeMinutes} min read`;

        return {
          id: article.id,
          headline: article.title,
          tldr: article.tldr || article.description || 'No summary available',
          author: article.author || sourceName,
          imageUrl: article.image_url || '/placeholder.svg',
          readTime,
          publishedAt: article.published_at,
          sourceUrl: article.url
        };
      });

      return transformedNews;

    } catch (error) {
      console.error('Error in fetchAllNews:', error);
      throw error;
    }
  }

}

export const newsService = new NewsService();
