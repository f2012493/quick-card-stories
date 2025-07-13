
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      if (data.success) {
        toast.success('Video content generated successfully!');
      } else {
        toast.info(data.message || 'Video content is ready');
      }
    },
    onError: (error: any) => {
      console.error('Video generation failed:', error);
      toast.error('Failed to generate video content: ' + (error.message || 'Unknown error'));
    }
  });
};
