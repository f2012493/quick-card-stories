
import React from 'react';

interface VideoCardSwipeHandlerProps {
  showRelatedArticles: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  hasRelatedArticles?: boolean;
}

const VideoCardSwipeHandler = ({ 
  showRelatedArticles, 
  onSwipeRight, 
  onSwipeLeft,
  hasRelatedArticles = false
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
            } else if (deltaX < 0 && !showRelatedArticles && hasRelatedArticles) {
              onSwipeRight();
            }
          }
        }}
      />
      
      {/* Swipe indicators */}
      {hasRelatedArticles && !showRelatedArticles && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/20">
            <div className="flex items-center text-white/60 text-xs">
              <span className="mr-1">Related</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCardSwipeHandler;
