
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
    return window.innerHeight * 0.25; // Increased threshold for more deliberate swipes
  };

  const snapToPosition = (targetIndex: number) => {
    if (containerRef.current) {
      setIsTransitioning(true);
      const translateY = -targetIndex * window.innerHeight;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
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
    
    // Reduced resistance for smoother feel
    const resistance = 0.8;
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
    
    // More precise swipe detection
    const shouldSwipe = Math.abs(deltaY) > threshold || (velocity > 0.3 && Math.abs(deltaY) > 30);
    
    let targetIndex = currentIndex;
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        // Swipe down - go to previous
        targetIndex = currentIndex - 1;
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        // Swipe up - go to next
        targetIndex = currentIndex + 1;
      }
    }
    
    // Always snap to a position (either current or new)
    setCurrentIndex(targetIndex);
    snapToPosition(targetIndex);
    
    isDragging.current = false;
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
    const resistance = 0.8;
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
    
    const shouldSwipe = Math.abs(deltaY) > threshold || (velocity > 0.3 && Math.abs(deltaY) > 30);
    
    let targetIndex = currentIndex;
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        targetIndex = currentIndex + 1;
      }
    }
    
    setCurrentIndex(targetIndex);
    snapToPosition(targetIndex);
    
    isDragging.current = false;
  };

  const handleCardTap = () => {
    // Tap functionality is handled in VideoCard component
  };

  useEffect(() => {
    if (containerRef.current && !isDragging.current && !isTransitioning) {
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
    </div>
  );
};

export default VideoFeed;
