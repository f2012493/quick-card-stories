
import React from 'react';
import { ChevronLeft, BookOpen } from 'lucide-react';

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
  const contextualInfo = currentNews.contextualInfo;

  return (
    <div className="relative w-full h-full bg-slate-950 text-white overflow-y-auto">
      {/* Minimal Header */}
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
            <h2 className="text-lg font-medium text-slate-200">Background Context</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {contextualInfo?.backgroundInfo && contextualInfo.backgroundInfo.length > 0 ? (
          <div className="space-y-4">
            {contextualInfo.backgroundInfo.map((info, index) => (
              <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800/50">
                <p className="text-slate-300 leading-relaxed">{info}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg mb-2">Loading context...</p>
            <p className="text-slate-500 text-sm">Gathering background information</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
