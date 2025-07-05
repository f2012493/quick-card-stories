
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
  onNavigateToArticle: (articleId: string) => void;
  onSwipeLeft: () => void;
}

const RelatedArticlesCarousel = ({ 
  currentNews, 
  onSwipeLeft 
}: RelatedArticlesCarouselProps) => {
  // Create a more comprehensive article content by combining available information
  const getFullArticleContent = () => {
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
    
    return content || 'Full article content is not available. Please visit the original source for the complete article.';
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
          <h2 className="text-lg font-medium text-slate-200">Full Article</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Full Article Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
            {getFullArticleContent()}
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
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
