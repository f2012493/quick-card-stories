
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
      
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: options
      });

      if (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
      }

      return data.news || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
};
