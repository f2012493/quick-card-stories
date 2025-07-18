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
        // Try to process the article for story analysis
        try {
          const { data: processResult, error: processError } = await supabase
            .rpc('process_article_for_story_analysis', { article_id: articleId });

          if (processError) {
            console.error('Error processing article for story analysis:', processError);
            return null;
          }

          // Fetch the newly created analysis
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

          if (fetchError) {
            console.error('Error fetching new story analysis:', fetchError);
            return null;
          }

          return {
            ...newAnalysis,
            cards: (newAnalysis.story_cards || []).sort((a: StoryCard, b: StoryCard) => a.card_order - b.card_order)
          };
        } catch (error) {
          console.error('Error in story analysis processing:', error);
          return null;
        }
      }

      return {
        ...analysis,
        cards: (analysis.story_cards || []).sort((a: StoryCard, b: StoryCard) => a.card_order - b.card_order)
      };
    },
    enabled: !!articleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};