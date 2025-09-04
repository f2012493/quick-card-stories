
import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: async (): Promise<NewsItem[]> => {
      try {
        const news = await newsService.fetchAllNews();
        
        if (news.length > 0) {
          console.log(`Successfully fetched ${news.length} articles`);
          
          // Store in cache for offline use
          const cacheData = {
            news,
            timestamp: Date.now()
          };
          localStorage.setItem('news-cache', JSON.stringify(cacheData));
          
          return news;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching news:', error);
        
        // Try to load from cache as fallback
        try {
          const cachedNews = localStorage.getItem('news-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 15 * 60 * 1000; // 15 minutes
            
            if (parsed.news && parsed.news.length > 0 && cacheAge < maxCacheAge) {
              console.log(`Using cached news`);
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 3000,
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    refetchIntervalInBackground: false,
  });
};
