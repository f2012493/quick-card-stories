import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Share2, 
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useAuth } from '@/contexts/AuthContext';
import TrustScoring from './features/TrustScoring';
import SummarySelector from './features/SummarySelector';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';

import PoliticalFilterBadge from './PoliticalFilterBadge';

interface News {
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
  trustScore?: number;
  localRelevance?: number;
  clusterId?: string;
  contextualInsights?: string[];
  fullContent?: string;
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
  // Political content filtering metadata
  isPolitical?: boolean;
  democraticValue?: number;
  accuracyScore?: number;
  contextScore?: number;
  perspectiveBalance?: number;
  politicalFlag?: 'approved' | 'flagged' | 'rejected';
  flagReason?: string;
}

interface VideoCardProps {
  news: News;
  isActive: boolean;
  onNavigateToArticle: (url: string) => void;
}

const VideoCard = ({ news, isActive, onNavigateToArticle }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const [showMoreContext, setShowMoreContext] = useState(false);
  const [showPersonalImpact, setShowPersonalImpact] = useState(false);
  
  const [currentContent, setCurrentContent] = useState(news.fullContent || news.tldr);
  const [summaryType, setSummaryType] = useState('original');
  
  const { trackInteraction } = useUserTracking();
  const { user } = useAuth();
  const { data: relatedArticles } = useRelatedArticles(news.clusterId);

  useEffect(() => {
    if (isActive && user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'view'
      });
    }
  }, [isActive, news.id, trackInteraction, user]);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'like'
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.headline,
          text: news.tldr,
          url: news.sourceUrl || window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(news.sourceUrl || window.location.href);
      // Could add toast notification here
    }
    
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'share'
      });
    }
  };

  const handleReadOriginal = () => {
    if (news.sourceUrl) {
      if (onNavigateToArticle) {
        onNavigateToArticle(news.sourceUrl);
      } else {
        window.open(news.sourceUrl, '_blank');
      }
    }
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'click'
      });
    }
  };

  const handleShowRelated = () => {
    setShowRelatedArticles(true);
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'related_articles'
      });
    }
  };


  const handleSummaryChange = (summary: string, type: string) => {
    setCurrentContent(summary);
    setSummaryType(type);
  };

  // Swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.target as any).startX = touch.clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const startX = (e.target as any).startX;
    const deltaX = touch.clientX - startX;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        // Left swipe - show more context
        setShowMoreContext(true);
      } else if (deltaX > 0) {
        // Right swipe - show personal impact
        setShowPersonalImpact(true);
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image with Enhanced Gradient */}
      <div className="absolute inset-0">
        {news.imageUrl ? (
          <img
            src={news.imageUrl}
            alt={news.headline}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        {/* Enhanced gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            {news.publishedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(news.publishedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Increased top padding for mobile address bar */}
      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="px-4 pb-32 pt-20 space-y-6">
          
           {/* Headline - Prominently positioned */}
           <div className="space-y-3">
             <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight tracking-tight">
               {news.headline}
             </h1>
             
             {/* Author info and Political Filter Badge */}
             <div className="space-y-2">
               {news.author && (
                 <div className="flex items-center gap-2 text-white/70">
                   <User className="w-4 h-4" />
                   <span className="text-sm font-medium">{news.author}</span>
                   <span className="text-white/50">•</span>
                   <span className="text-sm">{news.readTime}</span>
                 </div>
               )}
               
               {/* Political Filter Badge */}
               <PoliticalFilterBadge
                 isPolitical={news.isPolitical}
                 democraticValue={news.democraticValue}
                 accuracyScore={news.accuracyScore}
                 contextScore={news.contextScore}
                 perspectiveBalance={news.perspectiveBalance}
                 politicalFlag={news.politicalFlag}
                 flagReason={news.flagReason}
               />
             </div>
           </div>

          {/* Summary Selector */}
          <SummarySelector
            articleId={news.id}
            content={news.fullContent || news.tldr}
            onSummaryChange={handleSummaryChange}
          />

          {/* TL;DR Content Card */}
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-accent text-sm font-semibold uppercase tracking-wider">
                Summary
              </span>
            </div>
            <p className="text-white/90 text-base leading-relaxed">
              {currentContent}
            </p>
          </div>

          {/* Trust Scoring */}
          <TrustScoring articleId={news.id} userId={user?.id} />

          {/* Action Buttons - Updated with icon-only design */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className={`p-3 rounded-full backdrop-blur-md border transition-all duration-200 ${
                  isLiked 
                    ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              
              {news.clusterId && relatedArticles && relatedArticles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowRelated}
                  className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">More</span>
                </Button>
              )}
              
            </div>

            <Button
              onClick={handleReadOriginal}
              className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl max-w-[140px] truncate"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Read Full</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Related Articles Modal */}
      {showRelatedArticles && relatedArticles && relatedArticles.length > 0 && (
        <RelatedArticlesCarousel
          articles={relatedArticles}
          onClose={() => setShowRelatedArticles(false)}
        />
      )}

      {/* More Context Modal */}
      {showMoreContext && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/80 border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">More Context</h3>
              <button 
                onClick={() => setShowMoreContext(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-white/90">
              {news.contextualInfo ? (
                <>
                  <div>
                    <h4 className="font-semibold text-accent mb-2">Background</h4>
                    <ul className="space-y-1 text-sm">
                      {news.contextualInfo.backgroundInfo?.map((info, index) => (
                        <li key={index}>• {info}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-accent mb-2">Key Facts</h4>
                    <ul className="space-y-1 text-sm">
                      {news.contextualInfo.keyFacts?.map((fact, index) => (
                        <li key={index}>• {fact}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-accent mb-2">Related Concepts</h4>
                    <ul className="space-y-1 text-sm">
                      {news.contextualInfo.relatedConcepts?.map((concept, index) => (
                        <li key={index}>• {concept}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-white/70">Additional context information will be available soon.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Impact Modal */}
      {showPersonalImpact && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/80 border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">How This Affects You</h3>
              <button 
                onClick={() => setShowPersonalImpact(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-white/90">
              <div>
                <h4 className="font-semibold text-accent mb-2">Local Relevance</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(news.localRelevance || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm">{Math.round((news.localRelevance || 0) * 100)}%</span>
                </div>
                <p className="text-sm text-white/70">
                  {news.localRelevance && news.localRelevance > 0.7 
                    ? "This story has high relevance to your area and may directly impact your daily life."
                    : news.localRelevance && news.localRelevance > 0.4
                    ? "This story has moderate relevance to your area and may indirectly affect you."
                    : "This story has lower direct impact on your immediate area but may have broader implications."
                  }
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Category Impact</h4>
                <p className="text-sm text-white/70">
                  {news.category === 'politics' && "Political developments can affect local policies, taxes, and community services."}
                  {news.category === 'business' && "Business news may impact job market, local economy, and consumer prices."}
                  {news.category === 'technology' && "Technology changes can influence how you work, communicate, and access services."}
                  {news.category === 'health' && "Health news may affect available treatments, insurance, and public health policies."}
                  {news.category === 'environment' && "Environmental news can impact air quality, climate, and local resources."}
                  {!['politics', 'business', 'technology', 'health', 'environment'].includes(news.category) && 
                    "This news may have various impacts depending on how it develops in your community."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VideoCard;
