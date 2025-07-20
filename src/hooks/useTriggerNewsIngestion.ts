
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTriggerNewsIngestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Manually triggering comprehensive news ingestion...');
      
      // Step 1: Trigger news ingestion with analysis
      const { data: ingestData, error: ingestError } = await supabase.functions.invoke('ingest-news', {
        body: { trigger: 'manual_comprehensive' }
      });

      if (ingestError) {
        console.error('Error triggering news ingestion:', ingestError);
        throw new Error(`Failed to ingest news: ${ingestError.message}`);
      }

      console.log('News ingestion completed:', ingestData);

      // Step 2: Trigger clustering of articles
      const { data: clusterData, error: clusterError } = await supabase.functions.invoke('cluster-articles', {
        body: { trigger: 'post_ingestion' }
      });

      if (clusterError) {
        console.warn('Error triggering clustering (non-critical):', clusterError);
        // Don't throw error for clustering as it's not critical
      } else {
        console.log('Article clustering completed:', clusterData);
      }

      // Step 3: Trigger story analysis for new articles
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('story-analyzer', {
          body: { trigger: 'batch_new_articles' }
        });

        if (analysisError) {
          console.warn('Error triggering story analysis (non-critical):', analysisError);
        } else {
          console.log('Story analysis triggered:', analysisData);
        }
      } catch (error) {
        console.warn('Story analysis trigger failed (non-critical):', error);
      }

      return { ingestData, clusterData };
    },
    onSuccess: () => {
      console.log('Comprehensive news update completed successfully');
      
      // Invalidate all news-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['story-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['clustered-news'] });
      
      toast.success('News feed updated with analysis');
    },
    onError: (error) => {
      console.error('Failed to update news feed:', error);
      toast.error('Failed to update news feed. Please try again.');
    }
  });
};
