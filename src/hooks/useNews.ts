
import { useQuery } from '@tanstack/react-query';
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
}

export const useNews = (options: UseNewsOptions = {}) => {
  return useQuery({
    queryKey: ['news', options],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with options:', options);
      
      try {
        const { data, error } = await supabase.functions.invoke('fetch-news', {
          body: options
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Supabase function error: ${error.message}`);
        }

        console.log('Supabase function response:', data);

        if (!data) {
          console.error('No data returned from function');
          throw new Error('No data returned from function');
        }

        if (data.error) {
          console.error('Function returned error:', data.error);
          throw new Error(`Function error: ${data.error}`);
        }

        const newsArray = data.news || [];
        console.log(`Successfully fetched ${newsArray.length} news articles`);
        
        return newsArray;
      } catch (err) {
        console.error('Error in useNews hook:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
