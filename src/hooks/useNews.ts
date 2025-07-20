
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
  storyBreakdown?: string;
  storyNature?: string;
  analysisConfidence?: number;
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
    queryKey: ['news', options.country, 'with-analysis'],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with integrated analysis...');
      
      try {
        const news = await newsService.fetchAllNews();
        console.log(`Successfully fetched ${news.length} articles with analysis data`);
        
        // Store successful fetch in cache
        if (news.length > 0) {
          const cacheData = {
            news,
            timestamp: Date.now(),
            hasAnalysis: news.some(article => article.storyBreakdown || article.storyNature)
          };
          localStorage.setItem('antinews-cache-analyzed', JSON.stringify(cacheData));
        }
        
        return news;
      } catch (error) {
        console.error('Error fetching news with analysis:', error);
        
        // Try to load from cache as fallback
        try {
          const cachedNews = localStorage.getItem('antinews-cache-analyzed');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 10 * 60 * 1000; // 10 minutes
            
            if (parsed.news && parsed.news.length > 0 && cacheAge < maxCacheAge) {
              console.log('Using cached analyzed news');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached analyzed news:', cacheError);
        }
        
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 2000,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchIntervalInBackground: false,
  });
};
