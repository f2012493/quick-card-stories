
import React from 'react';
import { ChevronLeft, BookOpen, Link, Clock } from 'lucide-react';

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
  const contextualInfo = currentNews.contextualInfo;
  const clusteredArticles = contextualInfo?.clusteredArticles || [];

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
            <h2 className="text-lg font-medium text-slate-200">Additional Information</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Background Context */}
        {contextualInfo?.backgroundInfo && contextualInfo.backgroundInfo.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Background Context</h3>
            <div className="space-y-3">
              {contextualInfo.backgroundInfo.map((info, index) => (
                <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800/50">
                  <p className="text-slate-300 leading-relaxed text-sm">{info}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clustered Articles */}
        {clusteredArticles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Link className="w-4 h-4" />
              Related Articles
            </h3>
            <div className="space-y-3">
              {clusteredArticles.map((article, index) => (
                <div key={article.id} className="bg-slate-900/30 rounded-lg p-4 border border-slate-800/30 hover:bg-slate-900/50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    {article.image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={article.image_url} 
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-200 leading-snug mb-2 line-clamp-2">
                        {article.title}
                      </h4>
                      {article.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-2">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{article.author}</span>
                        {article.published_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(article.published_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!contextualInfo?.backgroundInfo || contextualInfo.backgroundInfo.length === 0) && 
         clusteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg mb-2">Processing article...</p>
            <p className="text-slate-500 text-sm">Additional information will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
