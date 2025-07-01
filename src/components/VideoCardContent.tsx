
import React from 'react';

interface NewsItem {
  headline: string;
  tldr: string;
  author: string;
  contextualInsights?: string[];
  localRelevance?: number;
}

interface VideoCardContentProps {
  news: NewsItem;
  showInsights: boolean;
  onToggleInsights: () => void;
}

const VideoCardContent = ({ news, showInsights, onToggleInsights }: VideoCardContentProps) => {
  return (
    <div className="flex-1 flex flex-col justify-end pb-32 md:pb-24">
      {/* Headline */}
      <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-2xl">
        {news.headline}
      </h1>

      {/* TL;DR */}
      <div className="mb-6">
        <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
          TL;DR
        </h2>
        <p className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium">
          {news.tldr}
        </p>
      </div>

      {/* Why This Matters */}
      <div className="mb-6">
        <button
          onClick={onToggleInsights}
          className="text-yellow-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg pointer-events-auto flex items-center gap-1"
        >
          Why This Matters {showInsights ? '▼' : '▶'}
        </button>
        {showInsights && (
          <div className="space-y-2">
            {(news.contextualInsights && news.contextualInsights.length > 0 ? news.contextualInsights : [
              'This development may influence economic decisions and policy changes in the region',
              'Citizens should stay informed about these changes as they may affect daily life and future planning'
            ]).slice(0, 2).map((insight, index) => (
              <p key={index} className="text-white/90 text-sm leading-relaxed drop-shadow-lg bg-black/20 p-3 rounded-md">
                • {insight}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Author */}
      <div className="mb-4">
        <p className="text-white/60 text-sm">By {news.author}</p>
        {(news.localRelevance || 0) > 0.7 && (
          <p className="text-green-400 text-xs mt-1">📍 High local relevance</p>
        )}
      </div>
    </div>
  );
};

export default VideoCardContent;
