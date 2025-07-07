
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface NewsItem {
  headline: string;
  tldr: string;
  author: string;
  sourceUrl?: string;
  localRelevance?: number;
  trustScore?: number;
}

interface VideoCardContentProps {
  news: NewsItem;
  showInsights: boolean;
  onToggleInsights: () => void;
}

const VideoCardContent = ({ news }: VideoCardContentProps) => {
  const handleLinkClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (news.sourceUrl) {
      // Use window.open for better mobile compatibility
      window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

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

      {/* Author and Source Link */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-white/60 text-sm">By {news.author}</p>
        {news.sourceUrl && (
          <button
            onClick={handleLinkClick}
            onTouchEnd={handleLinkClick}
            className="pointer-events-auto inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 active:text-blue-200 transition-colors text-xs font-medium bg-transparent border-none cursor-pointer touch-manipulation min-h-[44px] px-2"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <ExternalLink className="w-3 h-3" />
            Read Full
          </button>
        )}
      </div>

      {/* Source Reliability and Local Relevance */}
      <div className="mb-4 space-y-3">
        {/* Source Reliability */}
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs font-medium">Source Reliability</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 transition-all duration-300"
                style={{ width: `${Math.round((news.trustScore || 0.8) * 100)}%` }}
              />
            </div>
            <span className="text-green-400 text-xs font-semibold min-w-[32px]">
              {Math.round((news.trustScore || 0.8) * 100)}%
            </span>
          </div>
        </div>
        
        {/* Local Relevance */}
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs font-medium">Local Relevance</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-400 transition-all duration-300"
                style={{ width: `${Math.round((news.localRelevance || 0.6) * 100)}%` }}
              />
            </div>
            <span className="text-blue-400 text-xs font-semibold min-w-[32px]">
              {Math.round((news.localRelevance || 0.6) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCardContent;
