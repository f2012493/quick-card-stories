import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import Advertisement from './Advertisement';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useTriggerNewsIngestion } from '@/hooks/useTriggerNewsIngestion';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import CategoryFilter from './features/CategoryFilter';
import RevenueDashboard from './RevenueDashboard';

interface VideoFeedProps {
  onCreateExplainer?: () => void;
}

const VideoFeed = ({ onCreateExplainer }: VideoFeedProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [filteredNews, setFilteredNews] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const { locationData, isLoading: locationLoading } = useLocation();
  const triggerIngestion = useTriggerNewsIngestion();

  const { data: newsData = [], isLoading, error } = useNews({
    category: 'general',
    pageSize: 20,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  // Transform news data to include "Why It Matters" for explainer format
  const transformNewsToExplainers = (newsItems: any[]) => {
    return newsItems.map(item => ({
      ...item,
      whyItMatters: item.whyItMatters || generateWhyItMatters(item.tldr, item.category)
    }));
  };

  const generateWhyItMatters = (tldr: string, category: string) => {
    // Simple logic to generate "Why It Matters" based on category
    const matters = {
      'technology': 'This innovation could reshape how we interact with technology and transform entire industries.',
      'health': 'Understanding this development is crucial for making informed decisions about your health and wellbeing.',
      'politics': 'These political changes will directly impact policy decisions that affect your daily life.',
      'business': 'This business shift signals broader economic trends that could influence markets and job opportunities.',
      'science': 'This scientific breakthrough advances our understanding and opens new possibilities for future innovations.',
      'sports': 'This development showcases human achievement and influences the future of competitive sports.'
    };
    
    return matters[category.toLowerCase() as keyof typeof matters] || 
           'This story highlights important developments that help us understand our changing world.';
  };

  // Initialize with fresh news
  useEffect(() => {
    if (newsData.length > 0) {
      const transformedNews = transformNewsToExplainers(newsData);
      setAllNews(transformedNews);
      setIsInitialLoad(false);
      console.log('Fresh explainers loaded:', transformedNews.length, 'articles');
    }
  }, [newsData]);

  // Filter news by category
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allNews.filter(article => 
        article.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      setFilteredNews(filtered);
      setCurrentIndex(0);
    } else {
      setFilteredNews(allNews);
    }
  }, [allNews, selectedCategory]);

  // Create combined content array with ads inserted every 8 news items
  const createContentArray = useCallback(() => {
    const contentArray: Array<{ type: 'news' | 'ad', data: any, originalIndex?: number }> = [];
    let adIndex = 0;
    
    filteredNews.forEach((newsItem, index) => {
      contentArray.push({ type: 'news', data: newsItem, originalIndex: index });
      
      // Insert ad after every 8 news items
      if ((index + 1) % 8 === 0) {
        contentArray.push({ type: 'ad', data: { adIndex: adIndex++ } });
      }
    });
    
    return contentArray;
  }, [filteredNews]);

  const contentArray = createContentArray();

  // Get unique categories
  const categories = Array.from(new Set(allNews.map(article => article.category)));

  const handleRefreshNews = async () => {
    try {
      console.log('Triggering news refresh...');
      await triggerIngestion.mutateAsync();
      toast.success('News refresh initiated');
    } catch (error) {
      console.error('Failed to refresh news:', error);
      toast.error('Failed to refresh news');
    }
  };

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (containerRef.current) {
      const targetY = index * window.innerHeight;
      containerRef.current.scrollTo({
        top: targetY,
        behavior: smooth ? 'smooth' : 'instant'
      });
    }
  }, []);

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const now = Date.now();
    const timeDelta = now - lastTimeRef.current;
    const yDelta = clientY - lastYRef.current;
    
    if (timeDelta > 0) {
      velocityRef.current = yDelta / timeDelta;
    }
    
    lastYRef.current = clientY;
    lastTimeRef.current = now;
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const totalDelta = lastYRef.current - startYRef.current;
    const velocity = velocityRef.current;
    
    const minDistance = 50;
    const minVelocity = 0.3;
    
    let newIndex = currentIndex;
    
    if (Math.abs(totalDelta) > minDistance || Math.abs(velocity) > minVelocity) {
      if (totalDelta > 0 || velocity > minVelocity) {
        newIndex = Math.max(0, currentIndex - 1);
      } else if (totalDelta < 0 || velocity < -minVelocity) {
        newIndex = Math.min(filteredNews.length - 1, currentIndex + 1);
      }
    }
    
    setCurrentIndex(newIndex);
  }, [isDragging, currentIndex, filteredNews.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.clientY);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleEnd();
    }
  }, [isDragging, handleEnd]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - (handleWheel as any).lastWheelTime < 100) return;
    (handleWheel as any).lastWheelTime = now;
    
    if (e.deltaY > 0 && currentIndex < contentArray.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, contentArray.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < contentArray.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, contentArray.length]);

  useEffect(() => {
    scrollToIndex(currentIndex, true);
  }, [currentIndex, scrollToIndex]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientY);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  const navigateToArticle = useCallback((articleId: string) => {
    const targetIndex = contentArray.findIndex(item => 
      item.type === 'news' && item.data.id === articleId
    );
    if (targetIndex !== -1) {
      setCurrentIndex(targetIndex);
    }
  }, [contentArray]);

  if (isInitialLoad && isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading daily explainers...</p>
          {locationData && <p className="text-sm text-blue-400 mt-2">📍 {locationData.city}, {locationData.country}</p>}
        </div>
      </div>
    );
  }

  if (contentArray.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <p>No explainers found for the selected category.</p>
          <button
            onClick={() => setSelectedCategory(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Show All Explainers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden snap-y snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {contentArray.map((item, index) => (
          <div
            key={item.type === 'news' ? item.data.id : `ad-${item.data.adIndex}`}
            className="w-full h-screen snap-start snap-always flex-shrink-0"
            style={{
              transform: `translateY(${(index - currentIndex) * 100}vh)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {item.type === 'news' ? (
              <VideoCard
                news={item.data}
                isActive={index === currentIndex}
                index={index}
                allNews={filteredNews}
                onNavigateToArticle={navigateToArticle}
                readingSpeed={readingSpeed}
                onCreateExplainer={onCreateExplainer}
              />
            ) : (
              <Advertisement index={item.data.adIndex} />
            )}
          </div>
        ))}
      </div>
      
      {/* Category Filter */}
      {categories.length > 1 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}
      
      {/* Progress indicator */}
      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col space-y-1">
          {contentArray.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
            const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
            return (
              <div
                key={actualIndex}
                className={`w-0.5 h-6 rounded-full transition-all duration-300 ${
                  actualIndex === currentIndex 
                    ? 'bg-white shadow-lg shadow-white/30' 
                    : 'bg-white/30'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Location indicator */}
      {locationData && (
        <div className="fixed top-4 left-4 z-50 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-sm border border-white/20">
          📍 {locationData.city}, {locationData.country}
        </div>
      )}

      {/* Manual refresh button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleRefreshNews}
          disabled={triggerIngestion.isPending}
          className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/80 hover:text-white hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          title="Refresh explainers feed"
        >
          <RefreshCw className={`w-5 h-5 ${triggerIngestion.isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Revenue Dashboard */}
      <RevenueDashboard />
    </div>
  );
};

export default VideoFeed;
