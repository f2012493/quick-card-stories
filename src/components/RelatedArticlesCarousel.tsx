
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
            <p className="text-sm text-gray-400">Full story from source</p>
          </div>
        </div>
      </div>

      {/* Full Article Content */}
      <div className="p-4 space-y-6">
        {/* Article Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white leading-tight">
            {currentNews.headline}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>By {currentNews.author}</span>
            <span>•</span>
            <span>{currentNews.readTime}</span>
            {currentNews.publishedAt && (
              <>
                <span>•</span>
                <span>{new Date(currentNews.publishedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Article Image */}
        {currentNews.imageUrl && (
          <div className="w-full">
            <img 
              src={currentNews.imageUrl} 
              alt={currentNews.headline}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* TL;DR Section */}
        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800/30">
          <h3 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider">
            TL;DR
          </h3>
          <p className="text-gray-200 text-sm leading-relaxed">
            {currentNews.tldr}
          </p>
        </div>

        {/* Full Content */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg">Full Article</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed text-base">
              {currentNews.quote}
            </p>
            {/* Note: In a real implementation, you would fetch the full article content here */}
            <p className="text-gray-400 text-sm mt-4 italic">
              Full article content would be fetched from the original source here. 
              Currently showing the available excerpt.
            </p>
          </div>
        </div>

        {/* Source Link */}
        {currentNews.sourceUrl && (
          <div className="pt-4 border-t border-gray-800">
            <a 
              href={currentNews.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Read full article at source
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
