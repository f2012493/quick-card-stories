
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';

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
  const [api, setApi] = useState<CarouselApi>();
  const [fullArticleContent, setFullArticleContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const formatPublishedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const fetchFullArticleContent = async (sourceUrl?: string) => {
    if (!sourceUrl) {
      setFullArticleContent(currentNews.tldr || currentNews.headline);
      return;
    }

    setIsLoadingContent(true);
    try {
      // In a real implementation, you'd need a backend service to fetch and parse the article
      // For now, we'll use the available content
      const content = `${currentNews.tldr}\n\n${currentNews.quote}`;
      setFullArticleContent(content);
    } catch (error) {
      console.error('Failed to fetch article content:', error);
      setFullArticleContent(currentNews.tldr || currentNews.headline);
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchFullArticleContent(currentNews.sourceUrl);
  }, [currentNews]);

  const handleNext = () => {
    if (api) {
      api.scrollNext();
    }
  };

  const handlePrevious = () => {
    if (api) {
      api.scrollPrev();
    }
  };

  const handleArticleClick = (articleId: string) => {
    onNavigateToArticle(articleId);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 relative z-20">
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
      <div className="p-4 border-b border-gray-800 max-h-48 overflow-y-auto">
        <h3 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider">
          Current Story
        </h3>
        {isLoadingContent ? (
          <div className="text-white/70 text-sm">Loading full article...</div>
        ) : (
          <div className="text-white text-sm leading-relaxed whitespace-pre-line">
            {fullArticleContent}
          </div>
        )}
      </div>

      {/* Related Articles */}
      <div className="flex-1 overflow-hidden relative">
        <Carousel 
          orientation="vertical" 
          className="h-full"
          setApi={setApi}
        >
          <CarouselContent className="h-full">
            {relatedArticles.map((article) => (
              <CarouselItem key={article.id} className="basis-auto">
                <div
                  className="p-4 border-b border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer"
                  onClick={() => handleArticleClick(article.id)}
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
                      <p className="text-white/80 text-xs line-clamp-2 mb-2">
                        {article.tldr}
                      </p>
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

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RelatedArticlesCarousel;
