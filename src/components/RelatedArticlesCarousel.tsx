
import React from 'react';
import { ChevronLeft, Lightbulb, BookOpen, Tags } from 'lucide-react';

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
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwipeLeft}
            className="p-2.5 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">Additional Information</h2>
            <p className="text-sm text-slate-400">Context and background details</p>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 space-y-6">
        {contextualInfo ? (
          <>
            {/* Background Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-emerald-400">Background Context</h3>
              </div>
              <div className="space-y-3">
                {contextualInfo.backgroundInfo.map((info, index) => (
                  <div key={index} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30 hover:border-emerald-500/30 transition-colors duration-200">
                    <p className="text-slate-200 leading-relaxed">{info}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Facts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-400">Key Facts</h3>
              </div>
              <div className="space-y-2">
                {contextualInfo.keyFacts.map((fact, index) => (
                  <div key={index} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30 hover:border-amber-500/30 transition-colors duration-200">
                    <p className="text-slate-200">{fact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Concepts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-violet-400">Related Concepts</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {contextualInfo.relatedConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-violet-600/20 border border-slate-600/50 hover:border-violet-500/40 rounded-full text-sm text-slate-300 hover:text-violet-300 transition-all duration-200 cursor-default"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 mt-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg">Loading additional information...</p>
            <p className="text-sm mt-2 opacity-75">Please wait while we gather context</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
