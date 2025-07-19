
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

      // Get story analysis with cards
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

      if (!analysis) {
        console.log('No story analysis found for article:', articleId);
        return null;
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
  });
};
