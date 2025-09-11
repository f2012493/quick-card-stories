import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import VideoCardContent from './VideoCardContent';
import VideoCardHeader from './VideoCardHeader';
import VideoCardSwipeHandler from './VideoCardSwipeHandler';
import { useUserInteractions } from '@/hooks/useUserInteractions';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useAuth } from '@/contexts/AuthContext';
import TrustScoring from './features/TrustScoring';
import SummarySelector from './features/SummarySelector';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';
import StoryCardsCarousel from './StoryCardsCarousel';

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
  storyBreakdown?: string;
  storyNature?: string;
  analysisConfidence?: number;
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
}

interface VideoCardProps {
  news: News;
  isActive: boolean;
  onNavigateToArticle: (url: string) => void;
}

const VideoCard = ({ news, isActive, onNavigateToArticle }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const [showStoryCards, setShowStoryCards] = useState(false);
  const [currentContent, setCurrentContent] = useState(news.fullContent || news.tldr);
  const [summaryType, setSummaryType] = useState('original');
  
  const { trackInteraction } = useUserTracking();
  const { trackArticleView, trackArticleShare } = useUserInteractions();
  const { user } = useAuth();
  const { data: relatedArticles } = useRelatedArticles(news.clusterId);

  useEffect(() => {
    if (isActive && user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'view'
      });
      
      // Also track with new personalization system
      trackArticleView(news.id, news.category);
    }
  }, [isActive, news.id, trackInteraction, trackArticleView, news.category, user]);

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
      
      // Also track with new personalization system
      trackArticleShare(news.id, news.category);
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

  const handleShowStoryCards = () => {
    setShowStoryCards(true);
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: news.id,
        interactionType: 'story_cards'
      });
    }
  };

  const handleSummaryChange = (summary: string, type: string) => {
    setCurrentContent(summary);
    setSummaryType(type);
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
    <div className="relative w-full h-screen bg-black overflow-hidden">
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
            
          {/* TLDR Summary */}
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
            <p className="text-white/90 text-base leading-relaxed">
              {news.tldr}
            </p>
          </div>

          {/* Author info */}
            {news.author && (
              <div className="flex items-center gap-2 text-white/70">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{news.author}</span>
                <span className="text-white/50">•</span>
                <span className="text-sm">{news.readTime}</span>
              </div>
            )}
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
                  <MessageCircle className="w-5 h-5" />
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

      {/* Story Cards Modal */}
      <StoryCardsCarousel
        articleId={news.id}
        isOpen={showStoryCards}
        onClose={() => setShowStoryCards(false)}
        articleTitle={news.headline}
      />
    </div>
  );
};

export default VideoCard;
