
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

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
  const formatPublishedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onSwipeLeft}
          className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h2 className="text-white font-semibold text-lg">Full Coverage</h2>
        <div className="w-16" />
      </div>

      {/* Current Story Summary */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider">
          Current Story
        </h3>
        <p className="text-white text-sm leading-relaxed">
          {currentNews.headline}
        </p>
      </div>

      {/* Related Articles */}
      <div className="flex-1 overflow-hidden">
        <Carousel orientation="vertical" className="h-full">
          <CarouselContent className="h-full">
            {relatedArticles.map((article) => (
              <CarouselItem key={article.id} className="basis-auto">
                <div
                  className="p-4 border-b border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer"
                  onClick={() => onNavigateToArticle(article.id)}
                >
                  <div className="flex space-x-3">
                    <img
                      src={article.imageUrl}
                      alt={article.headline}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">
                        {article.headline}
                      </h4>
                      <div className="flex items-center text-xs text-gray-400 space-x-2">
                        <span>{article.readTime}</span>
                        {article.publishedAt && (
                          <span>{formatPublishedDate(article.publishedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
