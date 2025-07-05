
import React from 'react';
import { ChevronLeft, Info, Lightbulb, BookOpen, Tags } from 'lucide-react';

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
            <h2 className="text-lg font-semibold">Additional Information</h2>
            <p className="text-sm text-gray-400">Context and background details</p>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 space-y-6">
        {contextualInfo ? (
          <>
            {/* Topic Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-400">Topic</h3>
              </div>
              <p className="text-white font-medium">{contextualInfo.topic}</p>
            </div>

            {/* Background Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-400">Background Context</h3>
              </div>
              <div className="space-y-3">
                {contextualInfo.backgroundInfo.map((info, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-400">
                    <p className="text-gray-200 leading-relaxed">{info}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Facts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">Key Facts</h3>
              </div>
              <div className="space-y-2">
                {contextualInfo.keyFacts.map((fact, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-yellow-400">
                    <p className="text-gray-200">{fact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Concepts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-400">Related Concepts</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {contextualInfo.relatedConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Loading additional information...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
