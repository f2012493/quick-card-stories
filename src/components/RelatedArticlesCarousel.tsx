
import React from 'react';
import { ChevronLeft, ExternalLink, Clock, User } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
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
  const handleArticleClick = (articleId: string) => {
    onNavigateToArticle(articleId);
    onSwipeLeft(); // Close the carousel after selection
  };

  const formatPublishedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Get related articles from different categories or similar topics
  const filteredRelated = relatedArticles
    .filter(article => article.id !== currentNews.id)
    .slice(0, 8);

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
            <h2 className="text-lg font-semibold">Related Coverage</h2>
            <p className="text-sm text-gray-400">More stories you might find interesting</p>
          </div>
        </div>
      </div>

      {/* Current article summary */}
      <div className="p-4 border-b border-gray-800">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              NOW
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Currently Reading</h3>
              <p className="text-gray-300 text-sm line-clamp-2">{currentNews.headline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related articles grid */}
      <div className="p-4">
        <div className="space-y-4">
          {filteredRelated.map((article, index) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article.id)}
              className="bg-gray-900/30 rounded-lg p-4 cursor-pointer hover:bg-gray-800/50 transition-all duration-200 border border-gray-800/50 hover:border-gray-700 active:scale-95"
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </div>
                    {article.publishedAt && (
                      <span className="text-gray-500 text-xs">
                        {formatPublishedDate(article.publishedAt)}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 leading-tight">
                    {article.headline}
                  </h3>
                  
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                    {article.tldr}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <User className="w-3 h-3" />
                      {article.author}
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <span className="text-xs">Read more</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={article.imageUrl}
                    alt={article.headline}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRelated.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No related articles found</div>
            <button
              onClick={onSwipeLeft}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go back to main story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
