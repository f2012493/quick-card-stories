import { useMutation } from '@tanstack/react-query';

// This hook is no longer functional since user_reading_history table was removed
// Keeping for backward compatibility but logs instead of storing
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
      // Just log the interaction since table was removed
      console.log('User interaction tracked (logging only):', params);
      
      // Note: user_reading_history table has been removed
      // This now just logs the interaction without storing it
      return;
    },
    onError: (error) => {
      console.error('User tracking is disabled:', error);
    }
  });

  return { trackInteraction };
};
