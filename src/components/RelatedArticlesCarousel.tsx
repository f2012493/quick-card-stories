
import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
  trustScore?: number;
  localRelevance?: number;
}

interface RelatedArticlesCarouselProps {
  currentNews: NewsItem;
  onNavigateToArticle: (articleId: string) => void;
  onSwipeLeft: () => void;
}

const RelatedArticlesCarousel = ({ 
  currentNews, 
  onSwipeLeft 
}: RelatedArticlesCarouselProps) => {
  return (
    <div className="relative w-full h-full bg-black text-white overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwipeLeft}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Article Details</h2>
            <p className="text-sm text-gray-400">Additional information</p>
          </div>
        </div>
      </div>

      {/* Current article summary */}
      <div className="p-4 border-b border-gray-800">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              NOW
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Current Story</h3>
              <p className="text-gray-300 text-sm line-clamp-2">{currentNews.headline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust and relevance indicators */}
      <div className="p-4">
        <div className="p-4 bg-gray-900/20 rounded-lg border border-gray-800/30">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Story Quality</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Source Reliability</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-300"
                    style={{ width: `${(currentNews.trustScore || 0.8) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-green-400">
                  {Math.round((currentNews.trustScore || 0.8) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Local Relevance</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${(currentNews.localRelevance || 0.6) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-blue-400">
                  {Math.round((currentNews.localRelevance || 0.6) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
