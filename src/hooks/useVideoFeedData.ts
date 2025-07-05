
import { useState, useEffect, useCallback } from 'react';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { toast } from 'sonner';

export interface ContentItem {
  type: 'news' | 'ad';
  data: any;
  originalIndex?: number;
}

export const useVideoFeedData = () => {
  const [allNews, setAllNews] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);

  const { locationData } = useLocation();

  const { data: newsData = [], isLoading } = useNews({
    category: 'general',
    pageSize: 20,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  // Initialize with fresh news
  useEffect(() => {
    if (newsData.length > 0) {
      const realNews = newsData.filter(article => 
        article.author !== 'antiNews System' && 
        !article.headline.includes('Breaking: Real-time News Service')
      );
      
      if (realNews.length > 0) {
        setAllNews(realNews);
        setIsInitialLoad(false);
        setHasMorePages(realNews.length >= 20);
        console.log('Real news loaded:', realNews.length, 'articles');
      }
    }
  }, [newsData]);

  // Load more news when approaching the end
  const loadMoreNews = useCallback(async () => {
    if (isLoadingMore || !hasMorePages) return;
    
    setIsLoadingMore(true);
    try {
      console.log('Loading more news...');
      
      const moreNews = newsData.slice(0, 10).map((article, index) => ({
        ...article,
        id: `${article.id}-page${page}-${index}`,
        headline: `${article.headline} (Page ${page + 1})`
      }));
      
      if (moreNews.length > 0) {
        setAllNews(prev => [...prev, ...moreNews]);
        setPage(prev => prev + 1);
        console.log(`Loaded ${moreNews.length} more articles`);
        
        if (page >= 3) {
          setHasMorePages(false);
        }
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Failed to load more news:', error);
      toast.error('Failed to load more articles');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePages, page, newsData]);

  // Create combined content array with ads inserted every 8 news items
  const createContentArray = useCallback((): ContentItem[] => {
    const contentArray: ContentItem[] = [];
    let adIndex = 0;
    
    allNews.forEach((newsItem, index) => {
      contentArray.push({ type: 'news', data: newsItem, originalIndex: index });
      
      if ((index + 1) % 8 === 0) {
        contentArray.push({ type: 'ad', data: { adIndex: adIndex++ } });
      }
    });
    
    return contentArray;
  }, [allNews]);

  const resetPagination = () => {
    setPage(1);
    setHasMorePages(true);
  };

  return {
    allNews,
    isInitialLoad,
    isLoadingMore,
    hasMorePages,
    isLoading,
    loadMoreNews,
    createContentArray,
    resetPagination
  };
};
