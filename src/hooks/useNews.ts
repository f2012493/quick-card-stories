
import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';

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
  return useQuery({
    queryKey: ['comprehensive-news', options],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news from multiple sources...');
      
      try {
        const news = await newsService.fetchAllNews();
        console.log(`Successfully fetched ${news.length} articles from various sources`);
        
        // Cache the news locally
        const cacheData = {
          news,
          timestamp: Date.now()
        };
        localStorage.setItem('quick-card-stories-cache', JSON.stringify(cacheData));
        
        return news;
      } catch (error) {
        console.error('Error fetching comprehensive news:', error);
        
        // Try to load from cache as fallback
        try {
          const cachedNews = localStorage.getItem('quick-card-stories-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            if (parsed.news && parsed.news.length > 0) {
              console.log('Using cached news as fallback');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        // If everything fails, return curated news
        console.log('Using curated fallback news');
        return await newsService.fetchAllNews();
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
