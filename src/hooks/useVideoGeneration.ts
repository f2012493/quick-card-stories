
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoGenerationParams {
  articleId: string;
  title: string;
  content: string;
  imageUrl?: string;
}

export const useVideoGeneration = () => {
  return useMutation({
    mutationFn: async (params: VideoGenerationParams) => {
      console.log('Triggering video generation for:', params.articleId);
      
      const { data, error } = await supabase.functions.invoke('generate-video-content', {
        body: params
      });

      if (error) {
        console.error('Video generation error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Video generation successful:', data);
      // Removed toast notifications - video generation happens silently in background
    },
    onError: (error: any) => {
      console.error('Video generation failed:', error);
      // Removed toast notifications - errors are logged but not shown to user
    }
  });
};
