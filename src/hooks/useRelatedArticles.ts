
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRelatedArticles = (clusterId?: string) => {
  return useQuery({
    queryKey: ['related-articles', clusterId],
    queryFn: async () => {
      if (!clusterId) return [];
      
      const { data, error } = await supabase
        .from('cluster_articles')
        .select(`
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
      
      return data
        .map(item => item.articles)
        .filter(Boolean)
        .map(article => ({
          id: article!.id,
          title: article!.title,
          content: article!.content,
          description: article!.description,
          url: article!.url,
          image_url: article!.image_url,
          author: article!.author,
          published_at: article!.published_at
        }));
    },
    enabled: !!clusterId
  });
};
