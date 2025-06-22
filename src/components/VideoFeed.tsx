import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useTriggerNewsIngestion } from '@/hooks/useTriggerNewsIngestion';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredAutoFetch, setHasTriggeredAutoFetch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout>();

  const { locationData, isLoading: locationLoading } = useLocation();
  const triggerIngestion = useTriggerNewsIngestion();

  const { data: newsData = [], isLoading, error, isError, refetch } = useNews({
    category: 'general',
    pageSize: 10,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  // Auto-fetch news when no data is available
  useEffect(() => {
    const shouldAutoFetch = !isLoading && !locationLoading && newsData.length === 0 && !hasTriggeredAutoFetch && !triggerIngestion.isPending;
    
    if (shouldAutoFetch) {
      console.log('Auto-triggering news ingestion - no news available');
      setHasTriggeredAutoFetch(true);
      triggerIngestion.mutateAsync()
        .then(() => {
          // Wait a bit for clustering to complete, then refetch
          setTimeout(() => {
            refetch();
          }, 3000);
        })
        .catch((error) => {
          console.error('Auto-fetch failed:', error);
          setHasTriggeredAutoFetch(false); // Allow retry
        });
    }
  }, [isLoading, locationLoading, newsData.length, hasTriggeredAutoFetch, triggerIngestion, refetch]);

  // Set up auto-refresh every 5 minutes
  useEffect(() => {
    const setupAutoRefresh = () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      
      autoRefreshTimeoutRef.current = setTimeout(() => {
        console.log('Auto-refreshing news feed...');
        refetch();
        setupAutoRefresh(); // Schedule next refresh
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Only start auto-refresh if we have news data
    if (newsData.length > 0) {
      setupAutoRefresh();
    }

    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, [newsData.length, refetch]);

  // Initialize news data
  useEffect(() => {
    if (newsData.length > 0 && allNews.length === 0) {
      setAllNews(newsData);
    }
  }, [newsData]);

  // Load more news when approaching the end
  useEffect(() => {
    const shouldLoadMore = currentIndex >= allNews.length - 3 && !isLoadingMore && allNews.length > 0;
    
    if (shouldLoadMore) {
      loadMoreNews();
    }
  }, [currentIndex, allNews.length, isLoadingMore]);

  const loadMoreNews = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      // Refetch more news
      const { data: newNewsData } = await refetch();
      if (newNewsData && newNewsData.length > 0) {
        // Filter out duplicates and add new news
        const uniqueNews = newNewsData.filter(
          newItem => !allNews.some(existingItem => existingItem.id === newItem.id)
        );
        
        if (uniqueNews.length > 0) {
          setAllNews(prev => [...prev, ...uniqueNews]);
          console.log(`Loaded ${uniqueNews.length} more news items`);
        }
      }
    } catch (error) {
      console.error('Failed to load more news:', error);
      toast.error('Failed to load more news');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefreshNews = async () => {
    try {
      await triggerIngestion.mutateAsync();
      // Refetch news after ingestion
      setTimeout(() => {
        refetch();
      }, 2000); // Give some time for the clustering to complete
    } catch (error) {
      console.error('Failed to refresh news:', error);
    }
  };

  console.log('VideoFeed state:', { 
    allNewsLength: allNews.length, 
    currentIndex,
    isLoading, 
    isError, 
    error: error?.message,
    location: locationData,
    isLoadingMore,
    hasTriggeredAutoFetch,
    triggerIngestionPending: triggerIngestion.isPending
  });

  useEffect(() => {
    if (error) {
      console.error('News fetch error:', error);
      toast.error('Failed to load news. Please try again.');
    }
  }, [error]);

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

  if (isLoading || locationLoading || triggerIngestion.isPending) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{triggerIngestion.isPending ? 'Fetching latest news...' : 'Loading latest news...'}</p>
          {locationLoading && <p className="text-sm text-white/60 mt-2">Detecting your location...</p>}
          {locationData && <p className="text-sm text-blue-400 mt-2">📍 {locationData.city}, {locationData.country}</p>}
        </div>
      </div>
    );
  }

  if (isError || allNews.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <p>No news available at the moment.</p>
          <p className="text-sm text-white/60 mt-2">
            {isError ? `Error: ${error?.message}` : 'Fetching fresh news for you...'}
          </p>
          {locationData && (
            <p className="text-sm text-blue-400 mt-2">📍 {locationData.city}, {locationData.country}</p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button 
              onClick={handleRefreshNews}
              disabled={triggerIngestion.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${triggerIngestion.isPending ? 'animate-spin' : ''}`} />
              {triggerIngestion.isPending ? 'Fetching News...' : 'Fetch Latest News'}
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>
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
          {isLoadingMore && (
            <div className="w-0.5 h-6 rounded-full bg-blue-400 animate-pulse" />
          )}
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

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
          Loading more news...
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
