
import React from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';

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
  relatedArticles: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
  onSwipeLeft: () => void;
}

const RelatedArticlesCarousel = ({ 
  currentNews, 
  relatedArticles,
  onNavigateToArticle,
  onSwipeLeft 
}: RelatedArticlesCarouselProps) => {

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
          <h2 className="text-lg font-medium text-slate-200">Related Coverage</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Main Story Summary */}
        <div className="border-b border-slate-800 pb-6">
          <h3 className="text-xl font-bold text-white mb-3">{currentNews.headline}</h3>
          <p className="text-slate-300 leading-relaxed">{currentNews.tldr}</p>
          <div className="mt-3 text-sm text-slate-400">
            <span>By {currentNews.author}</span>
            {currentNews.publishedAt && (
              <span className="ml-3">
                {new Date(currentNews.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Related Articles */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">
            Related Coverage ({relatedArticles.length})
          </h4>
          
          {relatedArticles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No related articles found for this story.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relatedArticles.map((article, index) => (
                <div 
                  key={article.id}
                  className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors cursor-pointer"
                  onClick={() => onNavigateToArticle(article.id)}
                >
                  <div className="flex gap-4">
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.headline}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white mb-2 line-clamp-2">
                        {article.headline}
                      </h5>
                      <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                        {article.tldr}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{article.author}</span>
                        {article.publishedAt && (
                          <span>
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Original Source Link */}
        {currentNews.sourceUrl && (
          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={() => window.open(currentNews.sourceUrl, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Read Original Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
