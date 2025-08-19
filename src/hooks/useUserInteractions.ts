import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';

export const useUserInteractions = () => {
  const { user } = useAuth();
  const { locationData } = useLocation();

  const trackArticleView = useCallback(async (articleId: string, category?: string) => {
    if (!user?.id || !articleId) return;

    try {
      // Track in user interests (localStorage for immediate feedback)
      const interests = JSON.parse(localStorage.getItem('user-interests') || '{}');
      if (category) {
        interests[category] = (interests[category] || 0) + 1;
        localStorage.setItem('user-interests', JSON.stringify(interests));
      }

      // Update user profile preferences and location in database
      if (category) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('content_preferences')
          .eq('id', user.id)
          .single();

        if (profile) {
          const preferences = profile.content_preferences || {};
          preferences[category] = (preferences[category] || 0) + 1;

          const updateData: any = {
            content_preferences: preferences,
            updated_at: new Date().toISOString()
          };

          // Update location data if available
          if (locationData) {
            updateData.location_country = locationData.country;
            updateData.location_city = locationData.city;
            updateData.location_region = locationData.region;
          }

          await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  }, [user?.id, locationData]);

  const trackArticleShare = useCallback(async (articleId: string, category?: string) => {
    if (!user?.id) return;
    
    try {
      // Higher weight for shares
      const interests = JSON.parse(localStorage.getItem('user-interests') || '{}');
      if (category) {
        interests[category] = (interests[category] || 0) + 3; // Higher weight for engagement
        localStorage.setItem('user-interests', JSON.stringify(interests));
      }
    } catch (error) {
      console.error('Error tracking article share:', error);
    }
  }, [user?.id]);

  const trackCategoryPreference = useCallback(async (category: string, preference: boolean) => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferred_categories')
        .eq('id', user.id)
        .single();

      if (profile) {
        let categories = profile.preferred_categories || [];
        if (preference) {
          if (!categories.includes(category)) {
            categories = [...categories, category];
          }
        } else {
          categories = categories.filter(cat => cat !== category);
        }

        const updateData: any = {
          preferred_categories: categories,
          updated_at: new Date().toISOString()
        };

        // Update location data if available
        if (locationData) {
          updateData.location_country = locationData.country;
          updateData.location_city = locationData.city;
          updateData.location_region = locationData.region;
        }

        await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating category preference:', error);
    }
  }, [user?.id, locationData]);

  return {
    trackArticleView,
    trackArticleShare,
    trackCategoryPreference
  };
};