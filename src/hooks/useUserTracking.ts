
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackInteractionParams {
  userId: string;
  clusterId?: string;
  articleId?: string;
  interactionType: 'view' | 'click' | 'share' | 'like';
  readDurationSeconds?: number;
}

interface UpdateTopicPreferenceParams {
  userId: string;
  topicKeywords: string[];
  positive: boolean; // true for positive interaction, false for negative
}

export const useUserTracking = () => {
  const trackInteraction = useMutation({
    mutationFn: async (params: TrackInteractionParams) => {
      const { data, error } = await supabase
        .from('user_reading_history')
        .insert({
          user_id: params.userId,
          cluster_id: params.clusterId,
          article_id: params.articleId,
          interaction_type: params.interactionType,
          read_duration_seconds: params.readDurationSeconds
        });

      if (error) throw error;
      return data;
    }
  });

  const updateTopicPreferences = useMutation({
    mutationFn: async (params: UpdateTopicPreferenceParams) => {
      const updates = params.topicKeywords.map(keyword => ({
        user_id: params.userId,
        topic_keyword: keyword.toLowerCase(),
        preference_score: params.positive ? 0.8 : 0.2,
        interaction_count: 1
      }));

      const { data, error } = await supabase
        .from('user_topic_preferences')
        .upsert(updates, { 
          onConflict: 'user_id,topic_keyword',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      return data;
    }
  });

  const updateUserProfile = useMutation({
    mutationFn: async (profile: {
      userId: string;
      locationCountry?: string;
      locationCity?: string;
      locationRegion?: string;
      preferredCategories?: string[];
    }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: profile.userId,
          location_country: profile.locationCountry,
          location_city: profile.locationCity,
          location_region: profile.locationRegion,
          preferred_categories: profile.preferredCategories
        });

      if (error) throw error;
      return data;
    }
  });

  return {
    trackInteraction,
    updateTopicPreferences,
    updateUserProfile
  };
};
