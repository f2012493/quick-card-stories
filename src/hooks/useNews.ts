
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
    queryKey: ['news', options.category, options.country], // Removed timestamp to prevent excessive refetching
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with optimized performance...');
      
      try {
        const news = await newsService.fetchAllNews();
        console.log(`Successfully fetched ${news.length} articles`);
        
        // Only cache real news articles, not template content
        if (news.length > 0 && !news.every(article => article.author === 'antiNews System')) {
          const cacheData = {
            news,
            timestamp: Date.now(),
            isRealNews: true
          };
          localStorage.setItem('antinews-cache', JSON.stringify(cacheData));
        }
        
        return news;
      } catch (error) {
        console.error('Error fetching news:', error);
        
        // Try to load from cache only if it's recent real news
        try {
          const cachedNews = localStorage.getItem('antinews-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 5 * 60 * 1000; // 5 minutes for mobile performance
            
            if (parsed.news && parsed.news.length > 0 && 
                cacheAge < maxCacheAge && parsed.isRealNews) {
              console.log('Using cached real news for performance');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        // Return empty array instead of template content
        return [];
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - longer for mobile performance
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Reduced retries for faster mobile experience
    retryDelay: 1000, // Faster retry for mobile
    refetchInterval: 5 * 60 * 1000, // Reduced frequency to 5 minutes
    refetchIntervalInBackground: false, // Disable background refetch on mobile
  });
};
