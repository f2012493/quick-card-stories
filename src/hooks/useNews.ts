import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
  trustScore?: number;
  localRelevance?: number;
  contextualInsights?: string[];
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
}

interface UseNewsOptions {
  category?: string;
  pageSize?: number;
  country?: string;
  city?: string;
  region?: string;
}

export const useNews = (options: UseNewsOptions = {}) => {
  return useQuery({
    queryKey: ['news', options.country],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with optimized performance...');
      
      try {
        const news = await newsService.fetchAllNews();
        console.log(`Successfully fetched ${news.length} articles`);
        
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
        
        try {
          const cachedNews = localStorage.getItem('antinews-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 5 * 60 * 1000;
            
            if (parsed.news && parsed.news.length > 0 && 
                cacheAge < maxCacheAge && parsed.isRealNews) {
              console.log('Using cached real news for performance');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        return [];
      }
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
};
