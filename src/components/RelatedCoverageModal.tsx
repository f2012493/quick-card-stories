
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface RelatedCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNews: NewsItem;
  allNews: NewsItem[];
}

const RelatedCoverageModal = ({ isOpen, onClose, currentNews, allNews }: RelatedCoverageModalProps) => {
  // Find related articles by matching keywords in headlines and categories
  const getRelatedArticles = () => {
    const currentWords = currentNews.headline.toLowerCase().split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'have', 'been'].includes(word)
    );

    const relatedArticles = allNews
      .filter(article => article.id !== currentNews.id)
      .map(article => {
        let score = 0;
        const articleWords = article.headline.toLowerCase().split(' ');
        
        // Check for matching keywords in headline
        currentWords.forEach(word => {
          if (articleWords.some(articleWord => articleWord.includes(word) || word.includes(articleWord))) {
            score += 2;
          }
        });
        
        // Bonus for same category
        if (article.category === currentNews.category) {
          score += 1;
        }
        
        return { ...article, relevanceScore: score };
      })
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Limit to top 5 related articles

    return relatedArticles;
  };

  const relatedArticles = getRelatedArticles();

  const handleArticleClick = (article: NewsItem) => {
    if (article.sourceUrl) {
      try {
        const newWindow = window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = article.sourceUrl;
        }
      } catch (error) {
        window.location.href = article.sourceUrl;
      }
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Full Coverage: {currentNews.headline}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Current Article */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-900 mb-2">Current Story</h3>
            <p className="text-gray-700 text-sm mb-3">{currentNews.tldr}</p>
            {currentNews.sourceUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleArticleClick(currentNews)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Read Original
              </Button>
            )}
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Related Coverage ({relatedArticles.length})</h3>
              <div className="space-y-4">
                {relatedArticles.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <img 
                        src={article.imageUrl} 
                        alt={article.headline}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {article.headline}
                        </h4>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.tldr}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {article.readTime}
                            </span>
                            {article.publishedAt && (
                              <span>{formatPublishedDate(article.publishedAt)}</span>
                            )}
                          </div>
                          {article.sourceUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleArticleClick(article)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No related coverage found for this story.</p>
              <p className="text-sm mt-2">Try checking back later for more articles on this topic.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedCoverageModal;
