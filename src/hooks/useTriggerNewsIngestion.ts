
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTriggerNewsIngestion = () => {
  return useMutation({
    mutationFn: async () => {
      console.log('Manually triggering news ingestion...');
      
      // First trigger news ingestion
      const { data: ingestData, error: ingestError } = await supabase.functions.invoke('ingest-news', {
        body: { trigger: 'manual' }
      });

      if (ingestError) {
        console.error('Error triggering news ingestion:', ingestError);
        throw new Error(`Failed to ingest news: ${ingestError.message}`);
      }

      console.log('News ingestion completed:', ingestData);

      // Then trigger clustering
      const { data: clusterData, error: clusterError } = await supabase.functions.invoke('cluster-articles', {
        body: { trigger: 'manual' }
      });

      if (clusterError) {
        console.error('Error triggering clustering:', clusterError);
        throw new Error(`Failed to cluster articles: ${clusterError.message}`);
      }

      console.log('Article clustering completed:', clusterData);

      return { ingestData, clusterData };
    },
    onSuccess: () => {
      // Removed success toast notification
      console.log('News feed updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update news feed:', error);
      toast.error('Failed to update news feed. Please try again.');
    }
  });
};
