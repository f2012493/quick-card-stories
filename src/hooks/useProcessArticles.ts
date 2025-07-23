
import { useState } from 'react';
import { toast } from 'sonner';

// Simplified version without clustering functionality
export const useProcessArticles = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processExistingArticles = async () => {
    setIsProcessing(true);
    
    try {
      // Since clustering is removed, we'll just show a message
      toast.info('Article processing feature has been simplified');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Articles are ready for viewing');
    } catch (error) {
      console.error('Error processing articles:', error);
      toast.error('Failed to process articles');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processExistingArticles,
    isProcessing
  };
};
