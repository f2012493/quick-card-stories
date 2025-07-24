
import { useState, useEffect, useCallback } from 'react';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Generate consistent TLDR with max 60 words
const generateTLDR = (description: string | null, content: string | null): string => {
  const text = description || content || '';
  if (!text) return 'Summary not available';
  
  const words = text.trim().split(/\s+/);
  if (words.length <= 60) return text;
  
  const truncated = words.slice(0, 60).join(' ');
  return truncated + '...';
};

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
  const { userProfile } = useAuth();

  const { data: newsData = [], isLoading } = useNews({
    category: 'general',
    limit: 20,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  // Initialize with fresh news
  useEffect(() => {
    if (newsData.length > 0) {
      // Map database fields to component expected fields
      const mappedNews = newsData.map(article => ({
        ...article,
        headline: article.title,
        imageUrl: article.image_url,
        tldr: generateTLDR(article.description, article.content),
        quote: '', // Not available in current data
        readTime: `${Math.ceil((article.content?.length || 0) / 200)} min read`,
        fullContent: article.content
      }));
      
      const realNews = mappedNews.filter(article => 
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
        headline: article.title,
        imageUrl: article.image_url,
        tldr: generateTLDR(article.description, article.content),
        quote: '',
        readTime: `${Math.ceil((article.content?.length || 0) / 200)} min read`,
        fullContent: article.content,
        id: `${article.id}-page${page}-${index}`
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

  // Create combined content array with ads inserted every 8 news items (only for non-subscribers)
  const createContentArray = useCallback((): ContentItem[] => {
    const contentArray: ContentItem[] = [];
    let adIndex = 0;
    const isSubscribed = userProfile?.subscription_status === 'subscribed';
    
    allNews.forEach((newsItem, index) => {
      contentArray.push({ type: 'news', data: newsItem, originalIndex: index });
      
      // Only insert ads if user is not subscribed
      if (!isSubscribed && (index + 1) % 8 === 0) {
        contentArray.push({ type: 'ad', data: { adIndex: adIndex++ } });
      }
    });
    
    return contentArray;
  }, [allNews, userProfile]);

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
