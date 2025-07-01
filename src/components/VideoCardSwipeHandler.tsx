
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

      {/* Swipe indicator */}
      {!showRelatedArticles && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 text-white/60">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Swipe left</span>
            <span className="text-lg">→</span>
            <span className="text-xs mt-1">for insights</span>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCardSwipeHandler;
