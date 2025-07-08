
import React, { ReactNode } from 'react';

interface VideoCardSwipeHandlerProps {
  children: ReactNode;
  onSwipe: (direction: 'up' | 'down') => void;
  isActive: boolean;
}

const VideoCardSwipeHandler = ({ 
  children,
  onSwipe,
  isActive 
}: VideoCardSwipeHandlerProps) => {
  return (
    <div className="relative w-full h-full">
      {/* Touch handlers for swiping */}
      <div
        className="absolute inset-0 z-30 touch-manipulation"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.target as any).startY = touch.clientY;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const startY = (e.target as any).startY;
          const deltaY = touch.clientY - startY;
          
          if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
              onSwipe('down');
            } else {
              onSwipe('up');
            }
          }
        }}
      />
      {children}
    </div>
  );
};

export default VideoCardSwipeHandler;
