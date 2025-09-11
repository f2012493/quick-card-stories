
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
    queryKey: ['news', options.country, 'stored-with-analysis'],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching news with stored analysis...');
      
      try {
        const news = await newsService.fetchAllNews();
        
        if (news.length > 0) {
          console.log(`Successfully fetched ${news.length} articles with analysis`);
          
          // Count how many have analysis data
          const analyzedCount = news.filter(article => 
            article.storyBreakdown || article.storyNature
          ).length;
          
          console.log(`${analyzedCount} out of ${news.length} articles have analysis data`);
          
          // Store in cache for offline use
          const cacheData = {
            news,
            timestamp: Date.now(),
            analyzedCount
          };
          localStorage.setItem('antinews-cache-with-analysis', JSON.stringify(cacheData));
          
          return news;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching news:', error);
        
        // Try to load from cache as fallback
        try {
          const cachedNews = localStorage.getItem('antinews-cache-with-analysis');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            const cacheAge = Date.now() - parsed.timestamp;
            const maxCacheAge = 15 * 60 * 1000; // 15 minutes
            
            if (parsed.news && parsed.news.length > 0 && cacheAge < maxCacheAge) {
              console.log(`Using cached news (${parsed.analyzedCount} analyzed articles)`);
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
