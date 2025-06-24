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
  // Handle close button clicks with proper event stopping
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // Handle dialog open change (for overlay clicks, escape key, etc.)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Improved related articles algorithm with stricter matching
  const getRelatedArticles = () => {
    // Extract key terms with better filtering
    const extractKeyTerms = (text: string): string[] => {
      const excludeWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'will', 'have', 'been', 'said', 'says', 'also', 'what', 'when', 'where', 'they', 'their', 'them', 'than', 'then', 'there', 'these', 'those', 'were', 'are', 'could', 'would', 'should', 'might', 'must', 'shall', 'can', 'may', 'did', 'do', 'does', 'don', 'doesn', 'won', 'wouldn', 'isn', 'aren', 'wasn', 'weren', 'hasn', 'haven', 'hadn', 'shouldn', 'couldn', 'wouldn', 'after', 'before', 'during', 'while', 'since', 'until', 'about', 'above', 'below', 'over', 'under', 'between', 'among', 'through', 'across', 'around', 'near', 'far', 'here', 'there', 'up', 'down', 'out', 'off', 'away', 'back', 'home', 'today', 'tomorrow', 'yesterday', 'now', 'soon', 'later', 'early', 'late', 'first', 'last', 'next', 'previous', 'some', 'many', 'few', 'all', 'most', 'other', 'another', 'each', 'every', 'both', 'either', 'neither', 'such', 'same', 'different', 'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'short', 'high', 'low', 'hard', 'easy', 'fast', 'slow', 'hot', 'cold', 'warm', 'cool', 'open', 'close', 'start', 'stop', 'begin', 'end', 'make', 'take', 'give', 'get', 'put', 'set', 'let', 'run', 'walk', 'come', 'go', 'see', 'look', 'find', 'know', 'think', 'feel', 'want', 'need', 'like', 'love', 'hate', 'hope', 'wish', 'try', 'use', 'work', 'play', 'live', 'die', 'kill', 'save', 'help', 'call', 'ask', 'tell', 'talk', 'speak', 'read', 'write', 'hear', 'listen', 'watch', 'show', 'turn', 'move', 'stop', 'wait', 'stay', 'leave', 'return', 'bring', 'carry', 'hold', 'keep', 'lose', 'win', 'buy', 'sell', 'pay', 'cost', 'spend', 'save', 'earn', 'own', 'share', 'break', 'fix', 'build', 'create', 'destroy', 'change', 'improve', 'grow', 'increase', 'decrease', 'add', 'remove', 'include', 'exclude', 'join', 'leave', 'enter', 'exit', 'arrive', 'depart', 'visit', 'meet', 'greet', 'welcome', 'goodbye', 'hello', 'thanks', 'please', 'sorry', 'excuse', 'pardon'];
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => 
          word.length > 4 && // Increased minimum length to reduce noise
          !excludeWords.includes(word) &&
          !word.match(/^\d+$/) // Exclude pure numbers
        );
      return [...new Set(words)];
    };

    // Extract named entities with better filtering
    const extractNamedEntities = (text: string): string[] => {
      const excludeEntities = ['The', 'And', 'For', 'With', 'From', 'This', 'That', 'Will', 'Have', 'Been', 'Said', 'Says', 'Also', 'What', 'When', 'Where', 'They', 'Their', 'Them', 'Than', 'Then', 'There', 'These', 'Those', 'Were', 'Are', 'After', 'Before', 'During', 'While', 'Since', 'Until', 'About', 'Above', 'Below', 'Over', 'Under', 'Between', 'Among', 'Through', 'Across', 'Around', 'Near', 'First', 'Last', 'Next', 'Previous', 'Some', 'Many', 'Most', 'Other', 'Another', 'Each', 'Every', 'Both', 'Either', 'Neither', 'Such', 'Same', 'Different'];
      
      // More precise regex for named entities
      const entities = text.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,2}\b/g) || [];
      return entities.filter((entity: string) => 
        entity.length > 3 && 
        !excludeEntities.includes(entity) &&
        !entity.match(/^[A-Z]+$/) // Exclude all-caps words that might be noise
      );
    };

    // Stricter semantic similarity with higher thresholds
    const findSemanticSimilarity = (text1: string, text2: string): number => {
      let score = 0;
      
      // More specific topic keywords with stricter matching
      const topicKeywords = {
        politics: ['election', 'government', 'president', 'minister', 'parliament', 'congress', 'senate', 'vote', 'campaign', 'policy', 'legislation', 'democrat', 'republican', 'party', 'political', 'democracy', 'constitution', 'federal', 'state', 'governor', 'mayor'],
        economy: ['economy', 'economic', 'market', 'stock', 'trade', 'business', 'financial', 'money', 'bank', 'investment', 'gdp', 'inflation', 'recession', 'growth', 'revenue', 'profit', 'finance', 'corporate', 'industry', 'commerce'],
        technology: ['technology', 'tech', 'artificial intelligence', 'software', 'hardware', 'digital', 'cyber', 'internet', 'algorithm', 'startup', 'innovation', 'computer', 'mobile', 'app', 'platform', 'cloud', 'data', 'programming'],
        health: ['health', 'medical', 'hospital', 'doctor', 'patient', 'medicine', 'treatment', 'disease', 'covid', 'pandemic', 'vaccine', 'virus', 'healthcare', 'pharmaceutical', 'clinical', 'surgery', 'therapy'],
        climate: ['climate', 'environment', 'green', 'renewable', 'carbon', 'emission', 'pollution', 'sustainability', 'weather', 'temperature', 'global warming', 'energy', 'solar', 'wind', 'conservation'],
        sports: ['sports', 'game', 'team', 'player', 'match', 'championship', 'league', 'tournament', 'season', 'score', 'victory', 'defeat', 'competition', 'athlete', 'coach', 'stadium'],
        international: ['international', 'global', 'world', 'country', 'nation', 'foreign', 'diplomatic', 'embassy', 'summit', 'treaty', 'alliance', 'border', 'trade', 'relations', 'cooperation']
      };

      const text1Lower = text1.toLowerCase();
      const text2Lower = text2.toLowerCase();

      // Stricter topic-based similarity - require multiple matches
      Object.values(topicKeywords).forEach((keywords: string[]) => {
        const text1Matches = keywords.filter((keyword: string) => text1Lower.includes(keyword)).length;
        const text2Matches = keywords.filter((keyword: string) => text2Lower.includes(keyword)).length;
        
        if (text1Matches > 1 && text2Matches > 1) { // Require at least 2 matches
          score += Math.min(text1Matches, text2Matches) * 4;
        } else if (text1Matches > 0 && text2Matches > 0) {
          score += 1; // Reduced score for single matches
        }
      });

      // More specific location matching
      const locations = ['united states', 'america', 'china', 'europe', 'india', 'russia', 'japan', 'brazil', 'canada', 'australia', 'africa', 'asia', 'washington', 'beijing', 'moscow', 'london', 'paris', 'tokyo', 'new york', 'california', 'texas', 'florida'];
      locations.forEach((location: string) => {
        if (text1Lower.includes(location) && text2Lower.includes(location)) {
          score += 6; // Higher score for specific location matches
        }
      });

      // More specific organization matching
      const organizations = ['microsoft', 'google', 'apple', 'amazon', 'facebook', 'meta', 'tesla', 'twitter', 'united nations', 'nato', 'world health organization', 'federal bureau', 'central intelligence', 'nasa', 'spacex'];
      organizations.forEach((org: string) => {
        if (text1Lower.includes(org) && text2Lower.includes(org)) {
          score += 7; // Higher score for organization matches
        }
      });

      return score;
    };

    const currentHeadlineTerms = extractKeyTerms(currentNews.headline);
    const currentTldrTerms = extractKeyTerms(currentNews.tldr);
    const currentEntities = extractNamedEntities(currentNews.headline + ' ' + currentNews.tldr);
    
    // Combine unique key terms
    const allKeyTerms = [...new Set([...currentHeadlineTerms, ...currentTldrTerms])];

    // Stricter filtering with higher minimum thresholds
    const relatedArticles = allNews
      .filter(article => article.id !== currentNews.id)
      .map(article => {
        let score = 0;
        const articleHeadline = article.headline.toLowerCase();
        const articleTldr = article.tldr.toLowerCase();
        const articleText = `${articleHeadline} ${articleTldr}`;
        const currentText = `${currentNews.headline.toLowerCase()} ${currentNews.tldr.toLowerCase()}`;
        
        // Named entity matching (highest weight) - stricter matching
        const articleEntities = extractNamedEntities(article.headline + ' ' + article.tldr);
        let entityMatches = 0;
        currentEntities.forEach((entity: string) => {
          const entityLower = entity.toLowerCase();
          const hasExactMatch = articleEntities.some((articleEntity: string) => {
            const articleEntityLower = articleEntity.toLowerCase();
            return articleEntityLower === entityLower;
          });
          if (hasExactMatch) {
            score += 10;
            entityMatches++;
          }
        });

        // Require at least one strong entity match for high relevance
        if (entityMatches === 0) {
          // Apply penalty for no entity matches
          score -= 3;
        }

        // Exact keyword matches - only significant terms
        let keywordMatches = 0;
        allKeyTerms.forEach((term: string) => {
          if (term.length > 5) { // Only longer, more meaningful terms
            if (articleHeadline.includes(term)) {
              score += 5;
              keywordMatches++;
            }
            if (articleTldr.includes(term)) {
              score += 3;
              keywordMatches++;
            }
          }
        });

        // Multi-word phrase matching - stricter
        const currentPhrases = currentNews.headline.toLowerCase().match(/\b\w{4,}\s+\w{4,}\b/g) || [];
        currentPhrases.forEach((phrase: string) => {
          if (articleText.includes(phrase)) {
            score += 8;
          }
        });

        // Enhanced semantic similarity
        const semanticScore = findSemanticSimilarity(currentText, articleText);
        score += semanticScore;

        // Category bonus - but reduced weight
        if (article.category === currentNews.category && currentNews.category !== 'general') {
          score += 3; // Reduced from previous implementation
        }

        // Time proximity bonus - stricter time windows
        if (currentNews.publishedAt && article.publishedAt) {
          const currentTime = new Date(currentNews.publishedAt).getTime();
          const articleTime = new Date(article.publishedAt).getTime();
          const hoursDiff = Math.abs(currentTime - articleTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 2) score += 4;
          else if (hoursDiff < 12) score += 2;
          else if (hoursDiff < 24) score += 1;
        }

        // Number matching - more precise
        const numberPattern = /\b\d{2,}\b/g; // Only numbers with 2+ digits
        const currentNumbers: string[] = (currentNews.headline + ' ' + currentNews.tldr).match(numberPattern) || [];
        const articleNumbers: string[] = (article.headline + ' ' + article.tldr).match(numberPattern) || [];
        
        currentNumbers.forEach((num: string) => {
          if (articleNumbers.includes(num)) {
            score += 3;
          }
        });

        // Penalty for very different article lengths (likely different types of content)
        const lengthDiff = Math.abs(currentNews.tldr.length - article.tldr.length);
        if (lengthDiff > 200) {
          score -= 2;
        }

        return { ...article, relevanceScore: score };
      })
      .filter(article => article.relevanceScore >= 8) // Increased threshold from 3 to 8
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6); // Reduced from 8 to 6 for better quality

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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full max-h-full md:max-w-4xl md:max-h-[85vh] h-screen md:h-auto overflow-y-auto bg-white m-0 md:m-auto rounded-none md:rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6 pt-4 md:pt-0">
          <div className="flex-1 pr-4">
            <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              Full Coverage: {currentNews.headline}
            </DialogTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCloseClick} 
            className="h-10 w-10 md:h-8 md:w-8 p-0 flex-shrink-0 hover:bg-gray-100 rounded-full z-30 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 md:space-y-6 p-4 md:p-6 pt-4">
          {/* Current Article */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <img 
                src={currentNews.imageUrl} 
                alt={currentNews.headline}
                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-900 mb-2 text-base md:text-lg">Current Story</h3>
                <p className="text-gray-700 text-sm md:text-base mb-3 line-clamp-3">{currentNews.tldr}</p>
                <div className="flex flex-wrap gap-2">
                  {currentNews.sourceUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => handleExternalLink(currentNews, e)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 text-sm h-8 px-3"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
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
              <h3 className="font-bold text-gray-900 mb-4 text-lg md:text-xl">
                Related Coverage ({relatedArticles.length} {relatedArticles.length === 1 ? 'article' : 'articles'})
              </h3>
              <div className="grid gap-4">
                {relatedArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group active:bg-gray-100"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={article.imageUrl} 
                        alt={article.headline}
                        className="w-20 h-16 md:w-24 md:h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 line-clamp-2 text-base md:text-lg group-hover:text-blue-600 transition-colors">
                            {article.headline}
                          </h4>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                        </div>
                        <p className="text-gray-600 text-sm md:text-base mb-3 line-clamp-2">
                          {article.tldr}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {article.readTime}
                            </span>
                            {article.publishedAt && (
                              <span>{formatPublishedDate(article.publishedAt)}</span>
                            )}
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs hidden md:inline">
                              Relevance: {article.relevanceScore}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleArticleClick(article)}
                              className="text-blue-600 hover:bg-blue-50 text-sm px-3 py-2"
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {article.sourceUrl && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => handleExternalLink(article, e)}
                                className="text-gray-600 border-gray-300 hover:bg-gray-50 text-sm px-3 py-2"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Source
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
            <div className="text-center py-8 md:py-12 text-gray-500">
              <div className="mb-4">
                <ExternalLink className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3" />
              </div>
              <p className="text-base md:text-lg font-medium">No related coverage found</p>
              <p className="text-sm md:text-base mt-2">This appears to be a unique or breaking news story.</p>
              {currentNews.sourceUrl && (
                <Button 
                  variant="outline" 
                  className="mt-6 text-base px-6 py-3"
                  onClick={(e) => handleExternalLink(currentNews, e)}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
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
