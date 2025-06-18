
import React, { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import { useNews } from '@/hooks/useNews';
import { toast } from 'sonner';

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startTime = useRef(0);

  const { data: newsData = [], isLoading, error } = useNews({
    category: 'general',
    pageSize: 20
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load news. Using offline content.');
    }
  }, [error]);

  const getSwipeThreshold = () => {
    // Use smaller threshold for mobile devices
    return window.innerHeight * 0.15; // 15% of screen height
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    isDragging.current = true;
    setIsTransitioning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // Add some resistance to prevent over-scrolling
    const resistance = 0.6;
    const adjustedDelta = deltaY * resistance;
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + adjustedDelta;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    const deltaY = currentY.current - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;
    const threshold = getSwipeThreshold();
    
    // Consider both distance and velocity for better UX
    const shouldSwipe = Math.abs(deltaY) > threshold || (velocity > 0.5 && Math.abs(deltaY) > 50);
    
    setIsTransitioning(true);
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        // Swipe down - go to previous
        setCurrentIndex(prev => prev - 1);
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        // Swipe up - go to next
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    isDragging.current = false;
    
    // Reset transition flag after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    
    startY.current = e.clientY;
    startTime.current = Date.now();
    isDragging.current = true;
    setIsTransitioning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isTransitioning) return;
    
    currentY.current = e.clientY;
    const deltaY = currentY.current - startY.current;
    const resistance = 0.6;
    const adjustedDelta = deltaY * resistance;
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + adjustedDelta;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    
    const deltaY = currentY.current - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;
    const threshold = getSwipeThreshold();
    
    const shouldSwipe = Math.abs(deltaY) > threshold || (velocity > 0.5 && Math.abs(deltaY) > 50);
    
    setIsTransitioning(true);
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    isDragging.current = false;
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleCardTap = () => {
    // Tap functionality is handled in VideoCard component
  };

  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const translateY = -currentIndex * window.innerHeight;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  }, [currentIndex]);

  // Disable scrolling on body when component is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading latest news...</div>
      </div>
    );
  }

  if (newsData.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <p>No news available at the moment.</p>
          <p className="text-sm text-white/60 mt-2">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ 
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        ref={containerRef}
        className={`${isTransitioning ? 'transition-transform duration-300 ease-out' : 'transition-none'}`}
        style={{
          transform: `translateY(${-currentIndex * window.innerHeight}px)`,
          height: `${newsData.length * 100}vh`,
          willChange: 'transform'
        }}
      >
        {newsData.map((news, index) => (
          <VideoCard
            key={news.id}
            news={news}
            isActive={index === currentIndex}
            index={index}
            onTap={handleCardTap}
          />
        ))}
      </div>
      
      {/* Progress indicator */}
      <div className="fixed right-3 sm:right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          {newsData.map((_, index) => (
            <div
              key={index}
              className={`w-0.5 sm:w-1 h-6 sm:h-8 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-400 shadow-lg shadow-blue-400/50' 
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoFeed;
