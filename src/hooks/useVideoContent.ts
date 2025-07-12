
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoContent = (articleId: string) => {
  return useQuery({
    queryKey: ['video-content', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('*')
        .eq('article_id', articleId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });
};
