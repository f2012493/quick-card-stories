
import React from 'react';
import { ChevronLeft, Lightbulb, BookOpen, Tags, Sparkles } from 'lucide-react';

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
    <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white overflow-y-auto">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Header with enhanced styling */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-xl border-b border-purple-500/20 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onSwipeLeft}
            className="group p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 rounded-2xl transition-all duration-300 hover:scale-110 border border-purple-500/30"
          >
            <ChevronLeft className="w-5 h-5 group-hover:text-purple-300 transition-colors" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Additional Information
              </h2>
            </div>
            <p className="text-sm text-slate-400">Deep dive into context and background</p>
          </div>
        </div>
      </div>

      {/* Content area with enhanced styling */}
      <div className="p-6 space-y-8">
        {contextualInfo ? (
          <>
            {/* Background Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  Background Context
                </h3>
              </div>
              <div className="space-y-3">
                {contextualInfo.backgroundInfo.map((info, index) => (
                  <div key={index} className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:transform hover:scale-[1.02]">
                      <p className="text-slate-200 leading-relaxed font-medium">{info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Facts */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  Key Facts
                </h3>
              </div>
              <div className="space-y-3">
                {contextualInfo.keyFacts.map((fact, index) => (
                  <div key={index} className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:transform hover:scale-[1.02]">
                      <p className="text-slate-200 font-medium">{fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Concepts */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
                  <Tags className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                  Related Concepts
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {contextualInfo.relatedConcepts.map((concept, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden cursor-default"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-sm group-hover:blur-none transition-all duration-300"></div>
                    <span className="relative inline-block px-6 py-3 bg-slate-900/60 backdrop-blur-sm border border-violet-500/30 hover:border-violet-400/50 rounded-full text-sm font-medium text-slate-300 hover:text-violet-300 transition-all duration-300 hover:transform hover:scale-105">
                      {concept}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 mt-16">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-full flex items-center justify-center border border-slate-600/50">
                <BookOpen className="w-10 h-10 opacity-50" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-xl font-semibold text-slate-300 mb-2">Loading additional information...</p>
            <p className="text-sm opacity-75">Gathering context and background details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
