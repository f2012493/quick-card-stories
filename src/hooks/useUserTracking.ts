
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackInteractionParams {
  userId: string;
  articleId: string;
  interactionType: 'view' | 'click' | 'like' | 'share' | 'trust_vote' | 'related_articles';
  clusterId?: string;
  readDurationSeconds?: number;
}

export const useUserTracking = () => {
  const trackInteraction = useMutation({
    mutationFn: async (params: TrackInteractionParams) => {
      const { error } = await supabase
        .from('user_reading_history')
        .insert({
          user_id: params.userId,
          article_id: params.articleId,
          cluster_id: params.clusterId,
          interaction_type: params.interactionType,
          read_duration_seconds: params.readDurationSeconds,
          read_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update user consumption count for views
      if (params.interactionType === 'view') {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            articles_consumed_today: supabase.sql`articles_consumed_today + 1`
          })
          .eq('id', params.userId);
        
        if (updateError) {
          console.error('Error updating consumption count:', updateError);
        }
      }
    },
    onError: (error) => {
      console.error('Error tracking interaction:', error);
    }
  });

  return { trackInteraction };
};
