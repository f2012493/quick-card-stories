
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

      console.log('Fetching story analysis for article:', articleId);

      try {
        // Check if this is a UUID article first
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(articleId);
        
        if (!isUUID) {
          console.log('Non-UUID article ID detected, creating mock analysis');
          return {
            id: 'mock-' + articleId,
            story_nature: 'other',
            confidence_score: 0.5,
            key_entities: [],
            key_themes: [],
            sentiment_score: 0.5,
            complexity_level: 1,
            estimated_read_time: 300,
            cards: []
          };
        }

        // First, try to get the article with story_breakdown and story_nature
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .select('story_breakdown, story_nature, analysis_confidence')
          .eq('id', articleId)
          .maybeSingle();

        if (articleError) {
          console.error('Error fetching article:', articleError);
          return null;
        }

        // If we have article data with story breakdown, create analysis from it
        if (article && (article.story_breakdown || article.story_nature)) {
          return {
            id: articleId,
            story_nature: article.story_nature || 'other',
            confidence_score: article.analysis_confidence || 0.5,
            key_entities: [],
            key_themes: [],
            sentiment_score: 0.5,
            complexity_level: 1,
            estimated_read_time: 300,
            cards: [{
              id: 'breakdown-1',
              card_type: 'overview',
              title: 'Story Breakdown',
              content: article.story_breakdown || 'No breakdown available',
              visual_data: null,
              card_order: 1,
              metadata: {}
            }]
          };
        }

        // Try to get from story_analysis table for UUID articles
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
          .maybeSingle();

        if (error) {
          console.error('Error fetching story analysis:', error);
          return null;
        }

        if (analysis) {
          return formatStoryAnalysis(analysis);
        }

        return null;
      } catch (error) {
        console.error('Error in story analysis query:', error);
        return null;
      }
    },
    enabled: !!articleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 1000,
  });
};

function formatStoryAnalysis(analysis: any): StoryAnalysis {
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
}
