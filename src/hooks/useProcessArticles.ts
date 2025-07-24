
import { useState } from 'react';
import { clusteringService } from '@/services/clusteringService';
import { toast } from 'sonner';

export const useProcessArticles = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processExistingArticles = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      toast.info('Starting article clustering process...');
      await clusteringService.processExistingArticles();
      toast.success('Article clustering completed successfully!');
    } catch (error) {
      console.error('Error processing articles:', error);
      toast.error('Failed to process articles for clustering');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processExistingArticles,
    isProcessing
  };
};
