
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { storyAnalysisService } from '@/services/storyAnalysisService';

export interface StoryCard {
  id: string;
  card_type: string;
  title: string;
  content: string;
  visual_data: any;
  card_order: number;
  metadata: any;
}

export interface StoryAnalysis {
  id: string;
  story_nature: string;
  confidence_score: number;
  key_entities: any[];
  key_themes: string[];
  sentiment_score: number;
  complexity_level: number;
  estimated_read_time: number;
  cards: StoryCard[];
}

export const useStoryAnalysis = (articleId: string) => {
  return useQuery({
    queryKey: ['story-analysis', articleId],
    queryFn: async (): Promise<StoryAnalysis | null> => {
      if (!articleId) return null;

      console.log('Fetching story analysis for article:', articleId);

      // First, try to get existing story analysis
      const { data: analysis, error } = await supabase
        .from('story_analysis')
        .select(`
          *,
          story_cards (
            id,
            card_type,
            title,
            content,
            visual_data,
            card_order,
            metadata
          )
        `)
        .eq('article_id', articleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching story analysis:', error);
        return null;
      }

      // If no analysis exists, trigger story analysis
      if (!analysis) {
        console.log('No story analysis found, triggering analysis for article:', articleId);
        
        try {
          const result = await storyAnalysisService.analyzeArticle(articleId);
          
          if (!result.success) {
            console.error('Failed to analyze article:', result.error);
            return null;
          }

          // Wait a moment for the analysis to complete, then fetch it
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const { data: newAnalysis, error: fetchError } = await supabase
            .from('story_analysis')
            .select(`
              *,
              story_cards (
                id,
                card_type,
                title,
                content,
                visual_data,
                card_order,
                metadata
              )
            `)
            .eq('article_id', articleId)
            .single();

          if (fetchError || !newAnalysis) {
            console.error('Error fetching new story analysis:', fetchError);
            return null;
          }

          return {
            id: newAnalysis.id,
            story_nature: newAnalysis.story_nature || 'other',
            confidence_score: newAnalysis.confidence_score || 0,
            key_entities: Array.isArray(newAnalysis.key_entities) ? newAnalysis.key_entities : [],
            key_themes: Array.isArray(newAnalysis.key_themes) ? newAnalysis.key_themes : [],
            sentiment_score: newAnalysis.sentiment_score || 0.5,
            complexity_level: newAnalysis.complexity_level || 1,
            estimated_read_time: newAnalysis.estimated_read_time || 300,
            cards: (newAnalysis.story_cards || []).sort((a: StoryCard, b: StoryCard) => a.card_order - b.card_order)
          };
        } catch (error) {
          console.error('Error triggering story analysis:', error);
          return null;
        }
      }

      // Convert the database result to match our StoryAnalysis interface
      return {
        id: analysis.id,
        story_nature: analysis.story_nature || 'other',
        confidence_score: analysis.confidence_score || 0,
        key_entities: Array.isArray(analysis.key_entities) ? analysis.key_entities : [],
        key_themes: Array.isArray(analysis.key_themes) ? analysis.key_themes : [],
        sentiment_score: analysis.sentiment_score || 0.5,
        complexity_level: analysis.complexity_level || 1,
        estimated_read_time: analysis.estimated_read_time || 300,
        cards: (analysis.story_cards || []).sort((a: StoryCard, b: StoryCard) => a.card_order - b.card_order)
      };
    },
    enabled: !!articleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 3000,
  });
};
