
import { useState, useRef, useCallback, useEffect } from 'react';

interface ContentItem {
  type: 'news' | 'ad';
  data: any;
}

export const useVideoFeedInteractions = (contentArray: ContentItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragThreshold = 50; // Minimum distance to trigger navigation
  const velocityThreshold = 0.5; // Minimum velocity to trigger navigation

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent scrolling
    const touchY = e.touches[0].clientY;
    setCurrentY(touchY);
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;
    const velocity = Math.abs(deltaY) / 100; // Simple velocity calculation
    
    // Determine navigation direction
    if (Math.abs(deltaY) > dragThreshold || velocity > velocityThreshold) {
      if (deltaY > 0 && currentIndex > 0) {
        // Swiping down - go to previous
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (deltaY < 0 && currentIndex < contentArray.length - 1) {
        // Swiping up - go to next
        setCurrentIndex(prev => Math.min(contentArray.length - 1, prev + 1));
      }
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  }, [isDragging, startY, currentIndex, contentArray.length]);

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  }, [isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const endY = e.clientY;
    const deltaY = endY - startY;
    
    if (Math.abs(deltaY) > dragThreshold) {
      if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (deltaY < 0 && currentIndex < contentArray.length - 1) {
        setCurrentIndex(prev => Math.min(contentArray.length - 1, prev + 1));
      }
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  }, [isDragging, startY, currentIndex, contentArray.length]);

  // Wheel event handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY > 0 && currentIndex < contentArray.length - 1) {
      setCurrentIndex(prev => Math.min(contentArray.length - 1, prev + 1));
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  }, [currentIndex, contentArray.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' && currentIndex < contentArray.length - 1) {
        setCurrentIndex(prev => Math.min(contentArray.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, contentArray.length]);

  const navigateToArticle = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    currentIndex,
    isDragging,
    containerRef,
    navigateToArticle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    setCurrentIndex
  };
};
