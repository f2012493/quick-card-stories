
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
  trustScore?: number;
  localRelevance?: number;
  contextualInsights?: string[];
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
    queryKey: ['fresh-news', options, Date.now()], // Add timestamp to force fresh fetches
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching fresh, real-time news...');
      
      try {
        const news = await newsService.fetchAllNews();
        console.log(`Successfully fetched ${news.length} fresh articles`);
        
        if (news.length > 0) {
          // Cache only valid news, not fallback content
          const cacheData = {
            news,
            timestamp: Date.now(),
            isRealNews: news.some(article => article.author !== 'antiNews System')
          };
          localStorage.setItem('antinews-cache', JSON.stringify(cacheData));
        }
        
        return news;
      } catch (error) {
        console.error('Error fetching fresh news:', error);
        
        // Try to load from cache only if it's recent and real news
        try {
          const cachedNews = localStorage.getItem('antinews-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 2 * 60 * 1000; // 2 minutes max for fresh news
            
            if (parsed.news && parsed.news.length > 0 && 
                cacheAge < maxCacheAge && parsed.isRealNews) {
              console.log('Using recent cached real news as temporary fallback');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        // Return empty array to show loading state rather than fake content
        console.log('No real news available, showing loading state');
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - very fresh for real news
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    refetchIntervalInBackground: true, // Keep refreshing even when tab is not active
  });
};
