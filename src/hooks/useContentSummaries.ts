
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useContentSummaries = (articleId: string) => {
  return useQuery({
    queryKey: ['content-summaries', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_summaries')
        .select('*')
        .eq('article_id', articleId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });
};
