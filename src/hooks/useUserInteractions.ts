import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserInteractions = () => {
  const { user } = useAuth();

  const trackArticleView = useCallback(async (articleId: string, category?: string) => {
    if (!user?.id || !articleId) return;

    try {
      // Track in user interests (localStorage for immediate feedback)
      const interests = JSON.parse(localStorage.getItem('user-interests') || '{}');
      if (category) {
        interests[category] = (interests[category] || 0) + 1;
        localStorage.setItem('user-interests', JSON.stringify(interests));
      }

      // Update user profile preferences in database
      if (category) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('content_preferences')
          .eq('id', user.id)
          .single();

        if (profile) {
          const preferences = profile.content_preferences || {};
          preferences[category] = (preferences[category] || 0) + 1;

          await supabase
            .from('user_profiles')
            .update({ 
              content_preferences: preferences,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  }, [user?.id]);

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

        await supabase
          .from('user_profiles')
          .update({ preferred_categories: categories })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating category preference:', error);
    }
  }, [user?.id]);

  return {
    trackArticleView,
    trackArticleShare,
    trackCategoryPreference
  };
};