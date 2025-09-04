import React, { useState, useRef, useCallback } from 'react';
import SimpleNewsCard from './SimpleNewsCard';
import { useNews } from '@/hooks/useNews';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NewsFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  const { data: news = [], isLoading, refetch, isRefetching } = useNews();

  const navigateToArticle = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = startYRef.current - currentYRef.current;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentIndex < news.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const deltaY = e.deltaY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentIndex < news.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleRefresh = () => {
    refetch();
    setCurrentIndex(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading news...</p>
        </div>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No news available</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {news.map((item, index) => (
          <div
            key={item.id}
            className="w-full h-screen flex-shrink-0"
            style={{
              transform: `translateY(${(index - currentIndex) * 100}vh)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            <SimpleNewsCard
              news={item}
              isActive={index === currentIndex}
              onNavigateToArticle={navigateToArticle}
            />
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1">
        {news.map((_, index) => (
          <div
            key={index}
            className={`w-1 h-6 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-primary/30'
            }`}
          />
        ))}
      </div>

      {/* Refresh Button */}
      <div className="absolute top-4 right-4 z-30">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefetching}
          className="bg-background/80 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default NewsFeed;