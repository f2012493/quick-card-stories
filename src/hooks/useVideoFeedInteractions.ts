
import { useState, useRef, useCallback, useEffect } from 'react';
import { ContentItem } from './useVideoFeedData';

export const useVideoFeedInteractions = (contentArray: ContentItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();

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
        newIndex = Math.min(contentArray.length - 1, currentIndex + 1);
      }
    }
    
    setCurrentIndex(newIndex);
  }, [isDragging, currentIndex, contentArray.length]);

  const navigateToArticle = useCallback((articleId: string) => {
    const targetIndex = contentArray.findIndex(item => 
      item.type === 'news' && item.data.id === articleId
    );
    if (targetIndex !== -1) {
      setCurrentIndex(targetIndex);
      setShowRelatedArticles(false); // Close related articles when navigating
    }
  }, [contentArray]);

  const handleSwipeRight = useCallback(() => {
    setShowRelatedArticles(true);
  }, []);

  const handleSwipeLeft = useCallback(() => {
    setShowRelatedArticles(false);
  }, []);

  // Event handlers
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

  // Auto-scroll to current index
  useEffect(() => {
    scrollToIndex(currentIndex, true);
  }, [currentIndex, scrollToIndex]);

  // Global mouse event handlers
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

  // Keyboard navigation
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

  return {
    currentIndex,
    isDragging,
    showRelatedArticles,
    containerRef,
    navigateToArticle,
    handleSwipeRight,
    handleSwipeLeft,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
};
