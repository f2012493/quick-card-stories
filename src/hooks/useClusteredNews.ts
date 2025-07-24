
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StoryCluster {
  id: string;
  title: string;
  description: string;
  category: string;
  representative_image_url?: string;
  latest_published_at: string;
  base_score: number;
  personalized_score?: number;
  rank_position?: number;
  article_count: number;
}

interface UseClusteredNewsOptions {
  userId?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export const useClusteredNews = (options: UseClusteredNewsOptions = {}) => {
  return useQuery({
    queryKey: ['clustered-news', options.userId, options.location],
    queryFn: async (): Promise<StoryCluster[]> => {
      console.log('Fetching clustered news feed:', options);
      
      try {
        if (options.userId) {
          // Get personalized feed for authenticated user
          const { data, error } = await supabase.functions.invoke('generate-feed', {
            body: { 
              user_id: options.userId,
              location: options.location 
            }
          });

          if (error) {
            console.error('Error fetching personalized feed:', error);
            throw new Error(`Feed generation error: ${error.message}`);
          }

          return data.feed || [];
        } else {
          // Get general top clusters for anonymous users
          const { data: clusters, error } = await supabase
            .from('story_clusters')
            .select('*')
            .eq('status', 'active')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('base_score', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error fetching general clusters:', error);
            throw error;
          }

          return clusters || [];
        }
      } catch (err) {
        console.error('Error in useClusteredNews hook:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
