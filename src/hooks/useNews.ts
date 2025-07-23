
import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';

interface UseNewsOptions {
  category?: string;
  limit?: number;
  offset?: number;
}

export const useNews = (options: UseNewsOptions = {}) => {
  return useQuery({
    queryKey: ['news', options],
    queryFn: () => newsService.getArticles(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => newsService.getArticleById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => newsService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};
