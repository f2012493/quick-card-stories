
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackInteractionParams {
  userId: string;
  articleId: string;
  interactionType: 'view' | 'click' | 'like' | 'share' | 'trust_vote' | 'related_articles' | 'story_cards';
  clusterId?: string;
  readDurationSeconds?: number;
}

export const useUserTracking = () => {
  const trackInteraction = useMutation({
    mutationFn: async (params: TrackInteractionParams) => {
      // User reading history table doesn't exist yet
      // Just update user consumption count for views
      if (params.interactionType === 'view') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('articles_consumed_today')
          .eq('id', params.userId)
          .single();
        
        if (profile) {
          const newCount = (profile.articles_consumed_today || 0) + 1;
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ articles_consumed_today: newCount })
            .eq('id', params.userId);
          
          if (updateError) {
            console.error('Error updating consumption count:', updateError);
          }
        }
      }
      
      // Log the interaction for debugging
      console.log('Tracked interaction:', params);
    },
    onError: (error) => {
      console.error('Error tracking interaction:', error);
    }
  });

  return { trackInteraction };
};
