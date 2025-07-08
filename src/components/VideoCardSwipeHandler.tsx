
import React from 'react';

interface VideoCardSwipeHandlerProps {
  showRelatedArticles: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

const VideoCardSwipeHandler = ({ 
  showRelatedArticles, 
  onSwipeRight, 
  onSwipeLeft 
}: VideoCardSwipeHandlerProps) => {
  return (
    <>
      {/* Touch handlers for swiping */}
      <div
        className="absolute inset-0 z-30 touch-manipulation"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.target as any).startX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const startX = (e.target as any).startX;
          const deltaX = touch.clientX - startX;
          
          if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && showRelatedArticles) {
              onSwipeLeft();
            } else if (deltaX < 0 && !showRelatedArticles) {
              onSwipeRight();
            }
          }
        }}
      />
    </>
  );
};

export default VideoCardSwipeHandler;
