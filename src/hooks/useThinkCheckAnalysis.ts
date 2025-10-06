import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmotionData {
  type: string;
  intensity: number;
}

export interface SourceData {
  name: string;
  bias: string;
  reliability: number;
  description: string;
}

export interface IntentData {
  type: string;
  confidence: number;
  explanation: string;
}

export interface ThinkCheckAnalysis {
  source: SourceData;
  intent: IntentData;
  emotions: EmotionData[];
  missing: string[];
  assumptions: string[];
}

export interface ThinkCheckResponse {
  articleId: string;
  analysis: ThinkCheckAnalysis;
  disclaimer: string;
  timestamp: string;
}

export const useThinkCheckAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ThinkCheckResponse | null>(null);

  const analyzeArticle = async (
    articleId: string,
    headline: string,
    content: string,
    author?: string,
    sourceUrl?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'analyze-article-think-check',
        {
          body: {
            articleId,
            headline,
            content,
            author,
            sourceUrl,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze article';
      setError(errorMessage);
      console.error('Think Check analysis error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyzeArticle,
    isLoading,
    error,
    data,
  };
};
