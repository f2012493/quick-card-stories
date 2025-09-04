
import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { useProcessArticles } from '@/hooks/useProcessArticles';

const ClusteringControls = () => {
  const { processExistingArticles, isProcessing } = useProcessArticles();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={processExistingArticles}
        disabled={isProcessing}
        variant="outline"
        size="sm"
        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Brain className="h-4 w-4 mr-2" />
        )}
        {isProcessing ? 'Processing...' : 'Process Articles'}
      </Button>
    </div>
  );
};

export default ClusteringControls;
