
import React, { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { toast } from 'sonner';

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const { locationData, isLoading: locationLoading } = useLocation();

  const { data: newsData = [], isLoading, error, isError } = useNews({
    category: 'general',
    pageSize: 20,
    country: locationData?.country,
    city: locationData?.city,
    region: locationData?.region
  });

  console.log('VideoFeed state:', { 
    newsDataLength: newsData.length, 
    isLoading, 
    isError, 
    error: error?.message,
    location: locationData
  });

  useEffect(() => {
    if (error) {
      console.error('News fetch error:', error);
      toast.error('Failed to load news. Please try again.');
    }
  }, [error]);

  const scrollToIndex = (index: number, smooth = true) => {
    if (containerRef.current) {
      const targetY = index * window.innerHeight;
      containerRef.current.scrollTo({
        top: targetY,
        behavior: smooth ? 'smooth' : 'instant'
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    lastTouchY.current = e.touches[0].clientY;
    lastTouchTime.current = Date.now();
    setIsScrolling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const currentTime = Date.now();
    
    lastTouchY.current = currentY;
    lastTouchTime.current = currentTime;
  };

  const handleTouchEnd = () => {
    const touchEndY = lastTouchY.current;
    const touchEndTime = lastTouchTime.current;
    
    const deltaY = touchEndY - touchStartY.current;
    const deltaTime = touchEndTime - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime; // pixels per ms
    
    const minSwipeDistance = 50;
    const minVelocity = 0.3;
    
    // Determine if this is a valid swipe
    const isValidSwipe = Math.abs(deltaY) > minSwipeDistance || velocity > minVelocity;
    
    if (isValidSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        // Swipe down - go to previous
        setCurrentIndex(prev => prev - 1);
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        // Swipe up - go to next
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handleScroll = () => {
    if (containerRef.current && !isScrolling) {
      const scrollTop = containerRef.current.scrollTop;
      const newIndex = Math.round(scrollTop / window.innerHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < newsData.length) {
        setCurrentIndex(newIndex);
      }
      
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to snap to position when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        scrollToIndex(currentIndex, true);
      }, 150);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < newsData.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, newsData.length]);

  // Scroll to current index when it changes
  useEffect(() => {
    if (!isScrolling) {
      scrollToIndex(currentIndex, true);
    }
  }, [currentIndex, isScrolling]);

  // Handle wheel events for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    const timeDiff = now - (handleWheel as any).lastWheelTime || 0;
    (handleWheel as any).lastWheelTime = now;
    
    // Throttle wheel events
    if (timeDiff < 100) return;
    
    if (e.deltaY > 0 && currentIndex < newsData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (isLoading || locationLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading latest news...</p>
          {locationLoading && <p className="text-sm text-white/60 mt-2">Detecting your location...</p>}
          {locationData && <p className="text-sm text-blue-400 mt-2">📍 {locationData.city}, {locationData.country}</p>}
        </div>
      </div>
    );
  }

  if (isError || newsData.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <p>No news available at the moment.</p>
          <p className="text-sm text-white/60 mt-2">
            {isError ? `Error: ${error?.message}` : 'Please check your connection and try again.'}
          </p>
          {locationData && (
            <p className="text-sm text-blue-400 mt-2">📍 Searched for: {locationData.city}, {locationData.country}</p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {newsData.map((news, index) => (
          <div
            key={news.id}
            className="w-full h-screen snap-start snap-always flex-shrink-0"
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
          {newsData.map((_, index) => (
            <div
              key={index}
              className={`w-0.5 h-6 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white shadow-lg shadow-white/30' 
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Location indicator */}
      {locationData && (
        <div className="fixed top-4 left-4 z-50 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-sm border border-white/20">
          📍 {locationData.city}, {locationData.country}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
