
import React from 'react';
import { ContentItem } from '@/hooks/useVideoFeedData';

interface VideoFeedProgressIndicatorProps {
  currentIndex: number;
  contentArray: ContentItem[];
}

const VideoFeedProgressIndicator = ({ currentIndex, contentArray }: VideoFeedProgressIndicatorProps) => {
  return (
    <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-1">
        {contentArray.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
          return (
            <div
              key={actualIndex}
              className={`w-0.5 h-6 rounded-full transition-all duration-300 ${
                actualIndex === currentIndex 
                  ? 'bg-white shadow-lg shadow-white/30' 
                  : 'bg-white/30'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VideoFeedProgressIndicator;
