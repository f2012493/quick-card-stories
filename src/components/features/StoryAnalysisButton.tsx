import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { storyAnalysisService } from '@/services/storyAnalysisService';
import { toast } from 'sonner';

interface StoryAnalysisButtonProps {
  articleId: string;
  onAnalysisComplete?: () => void;
}

const StoryAnalysisButton = ({ articleId, onAnalysisComplete }: StoryAnalysisButtonProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      toast.info('Analyzing story structure...');
      
      const result = await storyAnalysisService.analyzeArticle(articleId);
      
      if (result.success) {
        toast.success('Story analysis completed!');
        onAnalysisComplete?.();
      } else {
        toast.error(result.error || 'Failed to analyze story');
      }
    } catch (error) {
      console.error('Error analyzing story:', error);
      toast.error('Failed to analyze story');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      variant="outline"
      size="sm"
      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
    >
      {isAnalyzing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Brain className="h-4 w-4 mr-2" />
      )}
      {isAnalyzing ? 'Analyzing...' : 'Analyze Story'}
    </Button>
  );
};

export default StoryAnalysisButton;