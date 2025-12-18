
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RelatedArticle {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  url: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
}

export const useRelatedArticles = (clusterId?: string) => {
  return useQuery({
    queryKey: ['related-articles', clusterId],
    queryFn: async (): Promise<RelatedArticle[]> => {
      if (!clusterId) return [];
      
      // Use explicit foreign key hint to resolve ambiguity
      const { data, error } = await supabase
        .from('cluster_articles')
        .select(`
          article_id,
          articles!cluster_articles_article_id_fkey (
            id,
            title,
            content,
            description,
            url,
            image_url,
            author,
            published_at
          )
        `)
        .eq('cluster_id', clusterId)
        .limit(10);
      
      if (error) throw error;
      
      return (data || [])
        .map(item => item.articles)
        .filter((article): article is RelatedArticle => article !== null)
        .map(article => ({
          id: article.id,
          title: article.title,
          content: article.content,
          description: article.description,
          url: article.url,
          image_url: article.image_url,
          author: article.author,
          published_at: article.published_at
        }));
    },
    enabled: !!clusterId
  });
};
