
import { useQuery } from '@tanstack/react-query';
import { useClusteredNews } from './useClusteredNews';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

interface UseNewsOptions {
  category?: string;
  pageSize?: number;
  country?: string;
  city?: string;
  region?: string;
  userId?: string;
}

export const useNews = (options: UseNewsOptions = {}) => {
  const useNewBackend = true;

  const clusteredNewsQuery = useClusteredNews({
    userId: options.userId,
    location: {
      country: options.country,
      city: options.city,
      region: options.region
    }
  });

  const legacyNewsQuery = useQuery({
    queryKey: ['news', options],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with legacy system:', options);
      
      try {
        const { data, error } = await supabase.functions.invoke('fetch-news', {
          body: options
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Supabase function error: ${error.message}`);
        }

        const newsArray = data.news || [];
        console.log(`Successfully fetched ${newsArray.length} news articles`);
        
        return newsArray;
      } catch (err) {
        console.error('Error in legacy news hook:', err);
        // Don't throw error - let the component handle fallbacks
        return [];
      }
    },
    enabled: !useNewBackend || (useNewBackend && (!clusteredNewsQuery.data || clusteredNewsQuery.data.length === 0)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1, // Reduce retries to fail faster
    retryDelay: 1000,
  });

  if (useNewBackend) {
    if (clusteredNewsQuery.data && clusteredNewsQuery.data.length > 0) {
      const transformedData = clusteredNewsQuery.data.map((cluster, index) => ({
        id: cluster.id,
        headline: cluster.title,
        tldr: cluster.description || cluster.title,
        quote: cluster.description || '',
        author: 'News Team',
        category: cluster.category || 'general',
        imageUrl: cluster.representative_image_url || `https://images.unsplash.com/photo-${1504711434969 + index}?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
        readTime: '2 min read',
        publishedAt: cluster.latest_published_at,
        sourceUrl: ''
      })) || [];

      return {
        ...clusteredNewsQuery,
        data: transformedData
      };
    }
    
    if (legacyNewsQuery.data && legacyNewsQuery.data.length > 0) {
      return legacyNewsQuery;
    }
    
    // Return successful state even if no data - let component handle fallbacks
    return {
      ...clusteredNewsQuery,
      data: [],
      isError: false,
      error: null
    };
  }

  // For legacy mode, also return successful state on errors
  return {
    ...legacyNewsQuery,
    data: legacyNewsQuery.data || [],
    isError: false,
    error: legacyNewsQuery.error
  };
};
