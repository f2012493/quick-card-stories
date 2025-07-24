
import { useState, useEffect, useCallback } from 'react';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Generate consistent TLDR with max 60 words
const generateTLDR = (description: string | null, content: string | null, headline: string = ''): string => {
  const text = description || content || '';
  
  // If no text content, create a basic summary from headline
  if (!text || text.trim().length < 10) {
    return headline ? `Breaking: ${headline}` : 'Summary not available';
  }
  
  // Clean the text and split into words
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(/\s+/);
  
  if (words.length <= 60) return cleanText;
  
  const truncated = words.slice(0, 60).join(' ');
  return truncated + '...';
};

// Get contextual placeholder image
const getPlaceholderImage = (headline: string, category: string = ''): string => {
  const content = `${headline} ${category}`.toLowerCase();
  
  // Business/Economy themed images
  if (content.includes('economy') || content.includes('market') || content.includes('business') || content.includes('financial')) {
    return `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Technology themed images
  if (content.includes('technology') || content.includes('ai') || content.includes('digital') || content.includes('startup')) {
    return `https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Politics/Government themed images
  if (content.includes('modi') || content.includes('bjp') || content.includes('congress') || content.includes('election') || content.includes('government')) {
    return `https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Healthcare themed images
  if (content.includes('health') || content.includes('medical') || content.includes('hospital') || content.includes('vaccine')) {
    return `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Environment/Climate themed images
  if (content.includes('climate') || content.includes('environment') || content.includes('pollution') || content.includes('green')) {
    return `https://images.unsplash.com/photo-1569163139394-de44cb33c2a0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // City/Urban themed images for city-specific news
  if (content.includes('mumbai') || content.includes('delhi') || content.includes('bangalore') || content.includes('chennai')) {
    return `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Default news/breaking news image
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
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
        imageUrl: article.image_url || getPlaceholderImage(article.title, article.category),
        tldr: generateTLDR(article.description, article.content, article.title),
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
        imageUrl: article.image_url || getPlaceholderImage(article.title, article.category),
        tldr: generateTLDR(article.description, article.content, article.title),
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
