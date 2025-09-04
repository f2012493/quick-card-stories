
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisRequest {
  articleId: string;
  headline: string;
  content?: string;
  description?: string;
}

export const useStoryAnalysisManager = () => {
  const queryClient = useQueryClient();

  const triggerAnalysis = useMutation({
    mutationFn: async (request: AnalysisRequest) => {
      console.log('Triggering story analysis for:', request.headline);
      
      // For UUID articles, use the story-analyzer function
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.articleId);
      
      if (isUUID) {
        const { data, error } = await supabase.functions.invoke('story-analyzer', {
          body: {
            articleId: request.articleId,
            headline: request.headline,
            content: request.content,
            description: request.description
          }
        });

        if (error) {
          throw new Error(`Failed to analyze story: ${error.message}`);
        }

        return data;
      } else {
        // For non-UUID articles, return mock analysis
        return {
          success: true,
          analysisId: 'mock-' + request.articleId,
          storyNature: 'other',
          breakdown: 'Analysis available for database-stored articles only.',
          confidence: 0.5
        };
      }
    },
    onSuccess: (data, variables) => {
      console.log('Story analysis completed for:', variables.headline);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['story-analysis', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      
      toast.success('Story analysis completed');
    },
    onError: (error, variables) => {
      console.error('Story analysis failed for:', variables.headline, error);
      toast.error('Failed to analyze story');
    }
  });

  const batchAnalyze = useMutation({
    mutationFn: async (articles: AnalysisRequest[]) => {
      console.log(`Starting batch analysis of ${articles.length} articles`);
      
      const results = [];
      for (const article of articles) {
        try {
          const result = await triggerAnalysis.mutateAsync(article);
          results.push({ articleId: article.articleId, success: true, result });
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          results.push({ articleId: article.articleId, success: false, error });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Batch analysis completed: ${successful} successful, ${failed} failed`);
      toast.success(`Analyzed ${successful} articles successfully`);
      
      if (failed > 0) {
        toast.warning(`${failed} articles failed analysis`);
      }
      
      // Refresh news data
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error) => {
      console.error('Batch analysis failed:', error);
      toast.error('Batch analysis failed');
    }
  });

  return {
    triggerAnalysis,
    batchAnalyze,
    isAnalyzing: triggerAnalysis.isPending || batchAnalyze.isPending
  };
};
