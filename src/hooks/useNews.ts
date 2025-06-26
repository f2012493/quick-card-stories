
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
  whyItMatters?: string;
  location?: string;
  relevanceScore?: number;
}

interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
}

interface UseNewsOptions {
  category?: string;
  pageSize?: number;
  country?: string;
  city?: string;
  region?: string;
  userId?: string;
  location?: LocationData;
}

export const useNews = (options: UseNewsOptions = {}) => {
  const locationData = options.location || {
    country: options.country,
    city: options.city,
    region: options.region
  };

  return useQuery({
    queryKey: ['comprehensive-news', locationData, options.category],
    queryFn: async (): Promise<NewsItem[]> => {
      console.log('Fetching location-aware news...', locationData);
      
      try {
        const news = await newsService.fetchAllNews(locationData);
        console.log(`Successfully fetched ${news.length} location-relevant articles`);
        
        // Add "Why it matters" to articles that don't have it
        const enhancedNews = news.map(article => ({
          ...article,
          whyItMatters: article.whyItMatters || generateWhyItMatters(article.tldr, article.category, locationData)
        }));
        
        // Cache the news locally with location context
        const cacheData = {
          news: enhancedNews,
          location: locationData,
          timestamp: Date.now()
        };
        localStorage.setItem('smart-explainers-cache', JSON.stringify(cacheData));
        
        return enhancedNews;
      } catch (error) {
        console.error('Error fetching location-aware news:', error);
        
        // Try to load from cache as fallback
        try {
          const cachedNews = localStorage.getItem('smart-explainers-cache');
          if (cachedNews) {
            const parsed = JSON.parse(cachedNews);
            if (parsed.news && parsed.news.length > 0) {
              console.log('Using cached location-aware news as fallback');
              return parsed.news;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached news:', cacheError);
        }
        
        // Final fallback with location context
        console.log('Using location-aware fallback news');
        return await newsService.fetchAllNews(locationData);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for fresher news
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

function generateWhyItMatters(tldr: string, category: string, location?: LocationData): string {
  const locationContext = location?.city ? ` for people in ${location.city}` : '';
  
  const matters = {
    'technology': `This technological development could reshape how we work and live${locationContext}, creating new opportunities and changing entire industries.`,
    'health': `Understanding this health development is crucial for making informed decisions about your wellbeing${locationContext}.`,
    'politics': `These political changes will directly impact policy decisions that affect daily life${locationContext}.`,
    'business': `This business development signals broader economic trends that could influence local markets and job opportunities${locationContext}.`,
    'science': `This scientific breakthrough advances our understanding and opens new possibilities for innovation${locationContext}.`,
    'sports': `This sports development showcases human achievement and influences the future of competitive athletics${locationContext}.`,
    'environment': `Environmental changes like this have direct implications for air quality, climate, and quality of life${locationContext}.`,
    'local news': `This local development directly impacts the community and reflects broader trends in urban planning and governance${locationContext}.`,
    'local business': `Local business developments like this create jobs, boost the economy, and improve services${locationContext}.`
  };
  
  const categoryKey = category.toLowerCase();
  return matters[categoryKey as keyof typeof matters] || 
         `This development highlights important changes that help us understand our evolving world${locationContext}.`;
}
