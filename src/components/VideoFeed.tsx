
import React, { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { toast } from 'sonner';

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastYRef = useRef(0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    lastYRef.current = e.touches[0].clientY;
    lastTimeRef.current = Date.now();
    isDragging.current = true;
    setIsTransitioning(false);
    velocityRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentTime = Date.now();
    const currentYPos = e.touches[0].clientY;
    const deltaY = currentYPos - startY.current;
    const timeDelta = currentTime - lastTimeRef.current;
    
    if (timeDelta > 0) {
      velocityRef.current = (currentYPos - lastYRef.current) / timeDelta;
      lastYRef.current = currentYPos;
      lastTimeRef.current = currentTime;
    }
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + deltaY;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    const deltaY = lastYRef.current - startY.current;
    const threshold = window.innerHeight * 0.15; // More sensitive threshold
    const velocityThreshold = 0.5;
    
    setIsTransitioning(true);
    
    let shouldSwipe = false;
    
    // Check velocity for quick swipes
    if (Math.abs(velocityRef.current) > velocityThreshold) {
      shouldSwipe = true;
    } else if (Math.abs(deltaY) > threshold) {
      shouldSwipe = true;
    }
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    isDragging.current = false;
    velocityRef.current = 0;
  };

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = Date.now();
    isDragging.current = true;
    setIsTransitioning(false);
    velocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const currentTime = Date.now();
    const currentYPos = e.clientY;
    const deltaY = currentYPos - startY.current;
    const timeDelta = currentTime - lastTimeRef.current;
    
    if (timeDelta > 0) {
      velocityRef.current = (currentYPos - lastYRef.current) / timeDelta;
      lastYRef.current = currentYPos;
      lastTimeRef.current = currentTime;
    }
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + deltaY;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    
    const deltaY = lastYRef.current - startY.current;
    const threshold = window.innerHeight * 0.15;
    const velocityThreshold = 0.5;
    
    setIsTransitioning(true);
    
    let shouldSwipe = false;
    
    if (Math.abs(velocityRef.current) > velocityThreshold) {
      shouldSwipe = true;
    } else if (Math.abs(deltaY) > threshold) {
      shouldSwipe = true;
    }
    
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (deltaY < 0 && currentIndex < newsData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    isDragging.current = false;
    velocityRef.current = 0;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < newsData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, newsData.length]);

  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const translateY = -currentIndex * window.innerHeight;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  }, [currentIndex]);

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
    <div 
      className="relative w-full h-screen overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ touchAction: 'pan-y' }}
    >
      <div
        ref={containerRef}
        className={`transition-transform duration-300 ease-out ${isTransitioning ? '' : 'transition-none'}`}
        style={{
          transform: `translateY(${-currentIndex * window.innerHeight}px)`
        }}
      >
        {newsData.map((news, index) => (
          <VideoCard
            key={news.id}
            news={news}
            isActive={index === currentIndex}
            index={index}
          />
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
