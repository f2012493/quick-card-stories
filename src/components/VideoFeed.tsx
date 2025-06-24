import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useTriggerNewsIngestion } from '@/hooks/useTriggerNewsIngestion';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

// Mock news data as fallback
const mockNewsData = [
  {
    id: 'mock-1',
    headline: 'Global Technology Summit Highlights AI Innovations',
    tldr: 'Leading tech companies showcased breakthrough AI technologies at the annual Global Technology Summit, focusing on practical applications in healthcare, education, and sustainable development.',
    quote: 'The summit brings together industry leaders to discuss the future of artificial intelligence and its impact on society.',
    author: 'Tech News Team',
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
    readTime: '3 min read',
    publishedAt: new Date().toISOString(),
    sourceUrl: ''
  },
  {
    id: 'mock-2',
    headline: 'Climate Change Initiatives Show Promising Results',
    tldr: 'New renewable energy projects across multiple countries are exceeding expected performance metrics, contributing significantly to global carbon emission reduction goals.',
    quote: 'Renewable energy investments are paying off with measurable environmental impact and economic benefits.',
    author: 'Environmental Reporter',
    category: 'Environment',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
    readTime: '4 min read',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sourceUrl: ''
  },
  {
    id: 'mock-3',
    headline: 'Scientific Breakthrough in Medical Research',
    tldr: 'Researchers announce significant progress in developing new treatment methods for chronic diseases, with clinical trials showing promising early results.',
    quote: 'This breakthrough could revolutionize treatment approaches for millions of patients worldwide.',
    author: 'Medical News',
    category: 'Health',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
    readTime: '5 min read',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    sourceUrl: ''
  },
  {
    id: 'mock-4',
    headline: 'Economic Markets Show Steady Growth',
    tldr: 'Global financial markets demonstrate resilience with consistent growth patterns, supported by strong consumer confidence and strategic policy measures.',
    quote: 'Market analysts remain optimistic about sustained economic growth in the coming quarters.',
    author: 'Financial Times',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
    readTime: '3 min read',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sourceUrl: ''
  },
  {
    id: 'mock-5',
    headline: 'Educational Innovation Programs Launch Globally',
    tldr: 'New educational initiatives focusing on digital literacy and STEM education are being implemented across schools worldwide, aiming to prepare students for future careers.',
    quote: 'These programs represent a significant investment in the future of education and student success.',
    author: 'Education Weekly',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
    readTime: '4 min read',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    sourceUrl: ''
  }
];

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [allNews, setAllNews] = useState<any[]>([]);
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
    pageSize: 10,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  // Initialize with cached news or mock data
  useEffect(() => {
    let initialNews = [];
    
    // Try to load cached news first
    try {
      const cachedNews = localStorage.getItem('quick-card-stories-cache');
      if (cachedNews) {
        const parsed = JSON.parse(cachedNews);
        if (parsed.news && parsed.news.length > 0) {
          initialNews = parsed.news;
          console.log('Loaded cached news:', initialNews.length, 'articles');
        }
      }
    } catch (error) {
      console.error('Failed to parse cached news:', error);
    }
    
    // If no cached news, use mock data to ensure users always see content
    if (initialNews.length === 0) {
      initialNews = mockNewsData;
      console.log('Using mock news data for initial load');
    }
    
    setAllNews(initialNews);
    setIsInitialLoad(false);
  }, []);

  // Update with fresh news when available
  useEffect(() => {
    if (newsData.length > 0) {
      console.log('Updating with fresh news:', newsData.length, 'articles');
      setAllNews(newsData);
      
      // Cache the fresh news
      const cacheData = {
        news: newsData,
        timestamp: Date.now()
      };
      localStorage.setItem('quick-card-stories-cache', JSON.stringify(cacheData));
    }
  }, [newsData]);

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

  // Touch and interaction handlers - keeping existing code
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
        newIndex = Math.min(allNews.length - 1, currentIndex + 1);
      }
    }
    
    setCurrentIndex(newIndex);
  }, [isDragging, currentIndex, allNews.length]);

  // Touch events
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

  // Mouse events for desktop
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

  // Wheel events
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - (handleWheel as any).lastWheelTime < 100) return;
    (handleWheel as any).lastWheelTime = now;
    
    if (e.deltaY > 0 && currentIndex < allNews.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, allNews.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < allNews.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allNews.length]);

  // Scroll to current index when it changes
  useEffect(() => {
    scrollToIndex(currentIndex, true);
  }, [currentIndex, scrollToIndex]);

  // Global mouse events for desktop drag
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
    const targetIndex = allNews.findIndex(news => news.id === articleId);
    if (targetIndex !== -1) {
      setCurrentIndex(targetIndex);
    }
  }, [allNews]);

  // Show loading only during initial load
  if (isInitialLoad) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading news...</p>
          {locationData && <p className="text-sm text-blue-400 mt-2">📍 {locationData.city}, {locationData.country}</p>}
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
        {allNews.map((news, index) => (
          <div
            key={news.id}
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
            <VideoCard
              news={news}
              isActive={index === currentIndex}
              index={index}
              allNews={allNews}
              onNavigateToArticle={navigateToArticle}
            />
          </div>
        ))}
      </div>
      
      {/* Progress indicator */}
      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col space-y-1">
          {allNews.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
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
          title="Refresh news feed"
        >
          <RefreshCw className={`w-5 h-5 ${triggerIngestion.isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* API status indicator */}
      {error && (
        <div className="fixed bottom-4 left-4 z-50 bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1 text-red-300 text-sm border border-red-500/30">
          Using cached content
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
