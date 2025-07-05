
import React from 'react';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react';

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
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
    clusteredArticles?: any[];
  };
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
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwipeLeft}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h2 className="text-lg font-medium text-slate-200">Full Article</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Article Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white leading-tight">
            {currentNews.headline}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>By {currentNews.author}</span>
            {currentNews.publishedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(currentNews.publishedAt)}</span>
              </div>
            )}
            <span>{currentNews.readTime}</span>
          </div>
        </div>

        {/* Article Image */}
        {currentNews.imageUrl && (
          <div className="w-full">
            <img 
              src={currentNews.imageUrl} 
              alt={currentNews.headline}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* TL;DR Section */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800/50">
          <h3 className="text-blue-400 text-sm font-semibold mb-3 uppercase tracking-wider">
            TL;DR
          </h3>
          <p className="text-slate-300 leading-relaxed">
            {currentNews.tldr}
          </p>
        </div>

        {/* Full Article Content */}
        <div className="space-y-4">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">
            Full Article
          </h3>
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
              {currentNews.quote || 'Full article content would be displayed here. Currently showing the available quote content as a placeholder for the full article text.'}
            </p>
          </div>
        </div>

        {/* Source Information */}
        {currentNews.sourceUrl && (
          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Read original article:</span>
              <a 
                href={currentNews.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Source →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
