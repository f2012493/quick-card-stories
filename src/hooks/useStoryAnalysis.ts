
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

      // Use raw SQL to avoid TypeScript issues with new tables
      const { data: analysis, error } = await supabase.rpc('get_story_analysis_with_cards', {
        article_id: articleId
      });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching story analysis:', error);
        
        // If the function doesn't exist, try direct table access
        try {
          const { data: directAnalysis, error: directError } = await supabase
            .from('story_analysis' as any)
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

          if (directError && directError.code !== 'PGRST116') {
            console.error('Direct query also failed:', directError);
            return null;
          }

          if (!directAnalysis) {
            // Trigger analysis if none exists
            console.log('No story analysis found, triggering analysis for article:', articleId);
            
            try {
              const result = await storyAnalysisService.analyzeArticle(articleId);
              
              if (!result.success) {
                console.error('Failed to analyze article:', result.error);
                return null;
              }

              // Wait for analysis to complete
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Try fetching again
              const { data: newAnalysis, error: fetchError } = await supabase
                .from('story_analysis' as any)
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

              return formatStoryAnalysis(newAnalysis);
            } catch (error) {
              console.error('Error triggering story analysis:', error);
              return null;
            }
          }

          return formatStoryAnalysis(directAnalysis);
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          return null;
        }
      }

      if (analysis && Array.isArray(analysis) && analysis.length > 0) {
        return formatStoryAnalysis(analysis[0]);
      }

      return null;
    },
    enabled: !!articleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 3000,
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
