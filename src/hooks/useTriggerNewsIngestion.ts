
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTriggerNewsIngestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Triggering comprehensive news ingestion with analysis...');
      
      // Trigger news ingestion which includes analysis
      const { data: ingestData, error: ingestError } = await supabase.functions.invoke('ingest-news', {
        body: { trigger: 'manual_with_analysis' }
      });

      if (ingestError) {
        console.error('Error triggering news ingestion:', ingestError);
        throw new Error(`Failed to ingest news: ${ingestError.message}`);
      }

      console.log('News ingestion with analysis completed:', ingestData);

      // Trigger clustering for better organization
      try {
        const { data: clusterData, error: clusterError } = await supabase.functions.invoke('cluster-articles', {
          body: { trigger: 'post_ingestion' }
        });

        if (clusterError) {
          console.warn('Clustering warning (non-critical):', clusterError);
        } else {
          console.log('Article clustering completed:', clusterData);
        }
      } catch (error) {
        console.warn('Clustering failed (non-critical):', error);
      }

      // Trigger detailed story analysis for database articles
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('story-analyzer', {
          body: { trigger: 'analyze_recent_articles' }
        });

        if (analysisError) {
          console.warn('Story analysis warning (non-critical):', analysisError);
        } else {
          console.log('Story analysis completed:', analysisData);
        }
      } catch (error) {
        console.warn('Story analysis failed (non-critical):', error);
      }

      return { 
        ingestData, 
        message: 'News ingestion with analysis completed successfully'
      };
    },
    onSuccess: (data) => {
      console.log('Comprehensive news update with analysis completed');
      
      // Invalidate all news-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['story-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['clustered-news'] });
      
      toast.success('News feed updated with fresh analysis');
    },
    onError: (error) => {
      console.error('Failed to update news feed with analysis:', error);
      toast.error('Failed to update news feed. Please try again.');
    }
  });
};
