import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, Clock, ArrowRight } from 'lucide-react';
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
  onNavigateToArticle: (articleId: string) => void;
}

const RelatedCoverageModal = ({ isOpen, onClose, currentNews, allNews, onNavigateToArticle }: RelatedCoverageModalProps) => {
  // Enhanced related articles algorithm
  const getRelatedArticles = () => {
    // Extract key terms from headline and description
    const extractKeyTerms = (text: string): string[] => {
      const excludeWords: string[] = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'have', 'been', 'said', 'says', 'also', 'what', 'when', 'where', 'they', 'their', 'them', 'than', 'then', 'there', 'these', 'those', 'were', 'are', 'could', 'would', 'should', 'might', 'must', 'shall', 'can', 'may', 'did', 'do', 'does', 'don', 'doesn', 'won', 'wouldn', 'isn', 'aren', 'wasn', 'weren', 'hasn', 'haven', 'hadn', 'shouldn', 'couldn', 'wouldn'];
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => 
          word.length > 3 && 
          !excludeWords.includes(word)
        );
      return [...new Set(words)];
    };

    // Extract named entities (capitalized words/phrases)
    const extractNamedEntities = (text: string): string[] => {
      const excludeEntities: string[] = ['The', 'And', 'For', 'With', 'From', 'This', 'That', 'Will', 'Have', 'Been', 'Said', 'Says', 'Also', 'What', 'When', 'Where', 'They', 'Their', 'Them', 'Than', 'Then', 'There', 'These', 'Those', 'Were', 'Are'];
      
      const entities = text.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g) || [];
      return entities.filter((entity: string) => 
        entity.length > 2 && 
        !excludeEntities.includes(entity)
      );
    };

    // Enhanced semantic similarity with broader keyword matching
    const findSemanticSimilarity = (text1: string, text2: string): number => {
      let score = 0;
      
      // Industry/topic keywords with higher weights
      const topicKeywords = {
        politics: ['election', 'government', 'president', 'minister', 'parliament', 'congress', 'senate', 'vote', 'campaign', 'policy', 'law', 'legislation', 'democrat', 'republican', 'party', 'political'],
        economy: ['economy', 'economic', 'market', 'stock', 'trade', 'business', 'financial', 'money', 'bank', 'investment', 'gdp', 'inflation', 'recession', 'growth'],
        technology: ['tech', 'technology', 'ai', 'artificial intelligence', 'software', 'hardware', 'digital', 'cyber', 'internet', 'data', 'algorithm', 'startup', 'innovation'],
        health: ['health', 'medical', 'hospital', 'doctor', 'patient', 'medicine', 'treatment', 'disease', 'covid', 'pandemic', 'vaccine', 'virus', 'healthcare'],
        climate: ['climate', 'environment', 'green', 'renewable', 'carbon', 'emission', 'pollution', 'sustainability', 'weather', 'temperature', 'global warming'],
        sports: ['sports', 'game', 'team', 'player', 'match', 'championship', 'league', 'tournament', 'season', 'score', 'win', 'defeat'],
        international: ['international', 'global', 'world', 'country', 'nation', 'foreign', 'diplomatic', 'embassy', 'summit', 'treaty', 'alliance']
      };

      const text1Lower = text1.toLowerCase();
      const text2Lower = text2.toLowerCase();

      // Check for topic-based similarity
      Object.values(topicKeywords).forEach((keywords: string[]) => {
        const text1Matches = keywords.filter((keyword: string) => text1Lower.includes(keyword)).length;
        const text2Matches = keywords.filter((keyword: string) => text2Lower.includes(keyword)).length;
        
        if (text1Matches > 0 && text2Matches > 0) {
          score += Math.min(text1Matches, text2Matches) * 3;
        }
      });

      // Geographic location matching
      const locations = ['usa', 'america', 'china', 'europe', 'india', 'russia', 'japan', 'brazil', 'canada', 'australia', 'africa', 'asia', 'washington', 'beijing', 'moscow', 'london', 'paris', 'tokyo'];
      locations.forEach((location: string) => {
        if (text1Lower.includes(location) && text2Lower.includes(location)) {
          score += 4;
        }
      });

      // Company/organization matching
      const organizations = ['microsoft', 'google', 'apple', 'amazon', 'facebook', 'meta', 'tesla', 'twitter', 'un', 'nato', 'who', 'fbi', 'cia', 'nasa'];
      organizations.forEach((org: string) => {
        if (text1Lower.includes(org) && text2Lower.includes(org)) {
          score += 5;
        }
      });

      return score;
    };

    const currentHeadlineTerms = extractKeyTerms(currentNews.headline);
    const currentTldrTerms = extractKeyTerms(currentNews.tldr);
    const currentEntities = extractNamedEntities(currentNews.headline + ' ' + currentNews.tldr);
    
    // Combine all key terms
    const allKeyTerms = [...new Set([...currentHeadlineTerms, ...currentTldrTerms])];

    // Create a more comprehensive search that includes partial matches
    const relatedArticles = allNews
      .filter(article => article.id !== currentNews.id)
      .map(article => {
        let score = 0;
        const articleHeadline = article.headline.toLowerCase();
        const articleTldr = article.tldr.toLowerCase();
        const articleText = `${articleHeadline} ${articleTldr}`;
        const currentText = `${currentNews.headline.toLowerCase()} ${currentNews.tldr.toLowerCase()}`;
        
        // Named entity matching (highest weight)
        const articleEntities = extractNamedEntities(article.headline + ' ' + article.tldr);
        currentEntities.forEach((entity: string) => {
          const entityLower = entity.toLowerCase();
          const hasMatch = articleEntities.some((articleEntity: string) => {
            const articleEntityLower = articleEntity.toLowerCase();
            return articleEntityLower === entityLower ||
                   articleEntityLower.includes(entityLower) ||
                   entityLower.includes(articleEntityLower);
          });
          if (hasMatch) {
            score += 8;
          }
        });

        // Exact keyword matches in headline (high weight)
        allKeyTerms.forEach((term: string) => {
          if (articleHeadline.includes(term)) {
            score += 4;
          }
          if (articleTldr.includes(term)) {
            score += 3;
          }
        });

        // Multi-word phrase matching
        const currentPhrases = currentNews.headline.toLowerCase().match(/\b\w+\s+\w+\b/g) || [];
        currentPhrases.forEach((phrase: string) => {
          if (articleText.includes(phrase)) {
            score += 5;
          }
        });

        // Substring matching for longer terms
        allKeyTerms.forEach((term: string) => {
          if (term.length > 5) {
            const regex = new RegExp(term.substring(0, term.length - 1), 'i');
            if (regex.test(articleText)) {
              score += 2;
            }
          }
        });

        // Enhanced semantic similarity
        score += findSemanticSimilarity(currentText, articleText);

        // Category bonus
        if (article.category === currentNews.category) {
          score += 2;
        }

        // Time proximity bonus
        if (currentNews.publishedAt && article.publishedAt) {
          const currentTime = new Date(currentNews.publishedAt).getTime();
          const articleTime = new Date(article.publishedAt).getTime();
          const hoursDiff = Math.abs(currentTime - articleTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 6) score += 3;
          else if (hoursDiff < 24) score += 2;
          else if (hoursDiff < 72) score += 1;
        }

        // Number/quantity matching with explicit string typing
        const numberPattern = /\d+/g;
        const currentNumbers: string[] = (currentNews.headline + ' ' + currentNews.tldr).match(numberPattern) || [];
        const articleNumbers: string[] = (article.headline + ' ' + article.tldr).match(numberPattern) || [];
        
        currentNumbers.forEach((num: string) => {
          if (articleNumbers.includes(num)) {
            score += 2;
          }
        });

        return { ...article, relevanceScore: score };
      })
      .filter(article => article.relevanceScore >= 3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);

    return relatedArticles;
  };

  const relatedArticles = getRelatedArticles();

  const handleArticleClick = (article: NewsItem) => {
    onClose();
    onNavigateToArticle(article.id);
  };

  const handleExternalLink = (article: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b sticky top-0 bg-white z-10">
          <div className="flex-1 pr-4">
            <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              Full Coverage: {currentNews.headline}
            </DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 md:space-y-6 pt-4">
          {/* Current Article */}
          <div className="bg-blue-50 rounded-lg p-3 md:p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <img 
                src={currentNews.imageUrl} 
                alt={currentNews.headline}
                className="w-12 h-12 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-900 mb-2 text-sm md:text-base">Current Story</h3>
                <p className="text-gray-700 text-xs md:text-sm mb-3 line-clamp-3">{currentNews.tldr}</p>
                <div className="flex flex-wrap gap-2">
                  {currentNews.sourceUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => handleExternalLink(currentNews, e)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs h-7 px-2"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Source
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 ? (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-lg">
                Related Coverage ({relatedArticles.length} {relatedArticles.length === 1 ? 'article' : 'articles'})
              </h3>
              <div className="grid gap-3 md:gap-4">
                {relatedArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="flex items-start gap-2 md:gap-4">
                      <img 
                        src={article.imageUrl} 
                        alt={article.headline}
                        className="w-12 h-12 md:w-24 md:h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 line-clamp-2 text-xs md:text-base group-hover:text-blue-600 transition-colors">
                            {article.headline}
                          </h4>
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                        </div>
                        <p className="text-gray-600 text-xs mb-2 md:mb-3 line-clamp-2">
                          {article.tldr}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1 md:gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readTime}
                            </span>
                            {article.publishedAt && (
                              <span className="hidden md:inline">{formatPublishedDate(article.publishedAt)}</span>
                            )}
                            <span className="bg-gray-100 px-1 md:px-2 py-1 rounded-full text-xs hidden md:inline">
                              Match: {article.relevanceScore}
                            </span>
                          </div>
                          <div className="flex gap-1 md:gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleArticleClick(article)}
                              className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-6 md:h-auto"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                            {article.sourceUrl && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => handleExternalLink(article, e)}
                                className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs px-2 py-1 h-6 md:h-auto"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                <span className="hidden md:inline">Source</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 text-gray-500">
              <div className="mb-4">
                <ExternalLink className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-2" />
              </div>
              <p className="text-sm md:text-base font-medium">No related coverage found</p>
              <p className="text-xs md:text-sm mt-2">This appears to be a unique or breaking news story.</p>
              {currentNews.sourceUrl && (
                <Button 
                  variant="outline" 
                  className="mt-4 text-sm"
                  onClick={(e) => handleExternalLink(currentNews, e)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read Original Source
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedCoverageModal;
