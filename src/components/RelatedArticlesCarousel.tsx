
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const templateFAQs = [
    {
      question: "What are the key facts?",
      answer: currentNews.tldr
    },
    {
      question: "Who's involved?",
      answer: `This story covers developments involving ${currentNews.author} and related parties in the ${currentNews.category} sector.`
    },
    {
      question: "What's the impact?",
      answer: currentNews.quote
    }
  ];

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

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Current Story Details */}
          <div className="space-y-4">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
              Current Story Details
            </h3>
            
            {/* Story Image */}
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img
                src={currentNews.imageUrl}
                alt={currentNews.headline}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Story Info */}
            <div className="space-y-3">
              <h4 className="text-white text-lg font-semibold leading-tight">
                {currentNews.headline}
              </h4>
              
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs uppercase font-medium">
                  {currentNews.category}
                </span>
                <span>{currentNews.readTime}</span>
                {currentNews.publishedAt && (
                  <span>{formatPublishedDate(currentNews.publishedAt)}</span>
                )}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">
                {currentNews.tldr}
              </p>

              {currentNews.quote && (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 text-sm">
                  "{currentNews.quote}"
                </blockquote>
              )}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-4">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
              Quick Facts
            </h3>
            
            <div className="space-y-3">
              {templateFAQs.map((faq, index) => (
                <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                  <h5 className="text-white font-medium text-sm mb-2">
                    {faq.question}
                  </h5>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          <div className="space-y-4">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
              Related Coverage ({relatedArticles.length})
            </h3>
            
            <div className="space-y-3">
              {relatedArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-gray-900/30 rounded-lg p-4 border border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToArticle(article.id)}
                >
                  <div className="flex space-x-3">
                    <img
                      src={article.imageUrl}
                      alt={article.headline}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                        {article.headline}
                      </h4>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs uppercase font-medium">
                          {article.category}
                        </span>
                        <span>{article.readTime}</span>
                        {article.publishedAt && (
                          <span>{formatPublishedDate(article.publishedAt)}</span>
                        )}
                      </div>

                      <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                        {article.tldr}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default RelatedArticlesCarousel;
