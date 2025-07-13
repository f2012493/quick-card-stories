
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoContent = (articleId: string) => {
  return useQuery({
    queryKey: ['video-content', articleId],
    queryFn: async () => {
      console.log('Fetching video content for article ID:', articleId, 'Type:', typeof articleId);
      
      const { data, error } = await supabase
        .from('video_content')
        .select('*')
        .eq('article_id', articleId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video content:', error);
        throw error;
      }
      
      console.log('Video content query result:', data);
      return data;
    }
  });
};
