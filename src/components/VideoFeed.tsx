
import React, { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import { newsData } from '../data/mockNews';

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    setIsTransitioning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + deltaY;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    const deltaY = currentY.current - startY.current;
    const threshold = window.innerHeight * 0.2;
    
    setIsTransitioning(true);
    
    if (deltaY > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (deltaY < -threshold && currentIndex < newsData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    isDragging.current = true;
    setIsTransitioning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    currentY.current = e.clientY;
    const deltaY = currentY.current - startY.current;
    
    if (containerRef.current) {
      const translateY = -currentIndex * window.innerHeight + deltaY;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    
    const deltaY = currentY.current - startY.current;
    const threshold = window.innerHeight * 0.2;
    
    setIsTransitioning(true);
    
    if (deltaY > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (deltaY < -threshold && currentIndex < newsData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    
    isDragging.current = false;
  };

  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const translateY = -currentIndex * window.innerHeight;
      containerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  }, [currentIndex]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
            key={index}
            news={news}
            isActive={index === currentIndex}
            index={index}
          />
        ))}
      </div>
      
      {/* Progress indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col space-y-2">
          {newsData.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-all duration-300 ${
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
