
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
  fullContent?: string;
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
  // Get the full article content, prioritizing extracted content
  const getFullArticleContent = () => {
    // Use extracted full content if available
    if (currentNews.fullContent && currentNews.fullContent.length > 200) {
      return currentNews.fullContent;
    }
    
    // Fallback to combining available information
    let content = '';
    
    // Start with the quote/main content
    if (currentNews.quote && currentNews.quote !== currentNews.tldr) {
      content += currentNews.quote;
    } else if (currentNews.tldr) {
      content += currentNews.tldr;
    }
    
    // Add contextual information if available
    if (currentNews.contextualInfo) {
      if (currentNews.contextualInfo.backgroundInfo?.length > 0) {
        content += '\n\nBackground Context:\n';
        content += currentNews.contextualInfo.backgroundInfo.join('\n\n');
      }
      
      if (currentNews.contextualInfo.keyFacts?.length > 0) {
        content += '\n\nKey Facts:\n';
        content += currentNews.contextualInfo.keyFacts.map(fact => `• ${fact}`).join('\n');
      }
    }
    
    return content || 'Full article content is being extracted. Please visit the original source for the complete article.';
  };

  const articleContent = getFullArticleContent();

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
          <h2 className="text-lg font-medium text-slate-200">Full Article</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Article Title */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-white mb-2">{currentNews.headline}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{currentNews.author}</span>
            <span>{currentNews.readTime}</span>
            {currentNews.publishedAt && (
              <span>{new Date(currentNews.publishedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Full Article Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
            {articleContent}
          </div>
        </div>

        {/* Source Link */}
        {currentNews.sourceUrl && (
          <div className="pt-6 border-t border-slate-800">
            <a 
              href={currentNews.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Read Original Article
            </a>
          </div>
        )}

        {/* Trust Score Indicator */}
        {currentNews.trustScore && (
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Trust Score:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${(currentNews.trustScore * 100)}%` }}
                  />
                </div>
                <span>{Math.round(currentNews.trustScore * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
