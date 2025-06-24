
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
  // Enhanced related articles algorithm with better matching
  const getRelatedArticles = () => {
    const currentWords = currentNews.headline.toLowerCase()
      .split(' ')
      .filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'have', 'been', 'said', 'says', 'also', 'what', 'when', 'where', 'they', 'their', 'them', 'than', 'then', 'there', 'these', 'those', 'were', 'are'].includes(word)
      );

    // Extract key entities and topics
    const currentTLDRWords = currentNews.tldr.toLowerCase()
      .split(' ')
      .filter(word => 
        word.length > 4 && 
        !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'have', 'been', 'said', 'says', 'also', 'what', 'when', 'where', 'they', 'their', 'them', 'than', 'then', 'there', 'these', 'those', 'were', 'are', 'according', 'reports', 'officials'].includes(word)
      );

    const allKeywords = [...new Set([...currentWords, ...currentTLDRWords])];

    const relatedArticles = allNews
      .filter(article => article.id !== currentNews.id)
      .map(article => {
        let score = 0;
        const articleHeadline = article.headline.toLowerCase();
        const articleTLDR = article.tldr.toLowerCase();
        const combinedText = `${articleHeadline} ${articleTLDR}`;
        
        // Check for exact keyword matches in headline (higher weight)
        allKeywords.forEach(keyword => {
          if (articleHeadline.includes(keyword)) {
            score += 3;
          }
          if (articleTLDR.includes(keyword)) {
            score += 2;
          }
        });

        // Check for partial matches and related terms
        currentWords.forEach(word => {
          if (word.length > 5) {
            // Check for partial matches (for names, places, etc.)
            const partialMatch = combinedText.split(' ').some(articleWord => 
              articleWord.includes(word) || word.includes(articleWord)
            );
            if (partialMatch) {
              score += 1;
            }
          }
        });
        
        // Bonus for same category
        if (article.category === currentNews.category) {
          score += 1;
        }

        // Bonus for similar time frame (within same day)
        if (currentNews.publishedAt && article.publishedAt) {
          const currentDate = new Date(currentNews.publishedAt);
          const articleDate = new Date(article.publishedAt);
          const timeDiff = Math.abs(currentDate.getTime() - articleDate.getTime());
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 1) {
            score += 2; // Same day
          } else if (daysDiff < 3) {
            score += 1; // Within 3 days
          }
        }

        // Check for named entities (capitalized words that might be proper nouns)
        const currentEntities = currentNews.headline.match(/\b[A-Z][a-z]+\b/g) || [];
        const articleEntities = article.headline.match(/\b[A-Z][a-z]+\b/g) || [];
        
        currentEntities.forEach(entity => {
          if (articleEntities.includes(entity)) {
            score += 3; // High score for matching proper nouns
          }
        });

        return { ...article, relevanceScore: score };
      })
      .filter(article => article.relevanceScore > 2) // Higher threshold for better relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Increased to show more related articles

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
              <h3 className="font-semibold text-gray-900 mb-4">
                Related Coverage ({relatedArticles.length} {relatedArticles.length === 1 ? 'article' : 'articles'})
              </h3>
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
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              Match: {article.relevanceScore}
                            </span>
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
              <p className="text-sm mt-2">This appears to be a unique or breaking news story.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedCoverageModal;
