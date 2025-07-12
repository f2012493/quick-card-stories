import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  Clock,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useAuth } from '@/contexts/AuthContext';
import TrustScoring from './features/TrustScoring';
import SummarySelector from './features/SummarySelector';
import VideoPlayer from './VideoPlayer';
import { useVideoContent } from '@/hooks/useVideoContent';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';

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
}

interface VideoCardProps {
  news: News;
  isActive: boolean;
  onNavigateToArticle: (url: string) => void;
}

const VideoCard = ({ news, isActive, onNavigateToArticle }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const [currentContent, setCurrentContent] = useState(news.fullContent || news.tldr);
  const [summaryType, setSummaryType] = useState('original');
  
  const { trackInteraction } = useUserTracking();
  const { user } = useAuth();
  const { data: videoContent } = useVideoContent(news.id);
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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Check if related articles are available
  const hasRelatedArticles = news.clusterId && relatedArticles && relatedArticles.length > 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video Player Background */}
      <VideoPlayer
        videoUrl={videoContent?.video_url}
        audioUrl={videoContent?.audio_url}
        isActive={isActive}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        subtitleData={videoContent?.subtitle_data}
        className="absolute inset-0"
      />

      {/* Content Overlay - Fixed mobile layout with proper safe areas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20">
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:pb-4" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <div className="space-y-3 max-h-[60vh] flex flex-col">

            {/* Summary Selector */}
            <div className="flex-shrink-0">
              <SummarySelector
                articleId={news.id}
                content={news.fullContent || news.tldr}
                onSummaryChange={handleSummaryChange}
              />
            </div>

            {/* Article Content - Scrollable area */}
            <div className="flex-1 min-h-0 space-y-3">
              <h1 className="text-white text-lg md:text-xl font-bold leading-tight line-clamp-3">
                {news.headline}
              </h1>
              
              <div className="text-white/90 text-sm md:text-base leading-relaxed overflow-y-auto max-h-32 md:max-h-40 scrollbar-hide">
                {currentContent}
              </div>

              {/* Article Meta - More compact */}
              <div className="flex items-center gap-2 text-white/70 text-xs flex-wrap">
                {news.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-24">{news.author}</span>
                  </div>
                )}
                {news.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">{formatTimeAgo(news.publishedAt)}</span>
                  </div>
                )}
                {news.localRelevance && news.localRelevance > 0.5 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>Local</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Scoring */}
            <div className="flex-shrink-0">
              <TrustScoring articleId={news.id} userId={user?.id} />
            </div>

            {/* Action Buttons - Compact mobile layout */}
            <div className="flex items-center justify-between flex-shrink-0 pt-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLike}
                  className={`flex items-center gap-1 px-2 py-1 h-8 ${
                    isLiked ? 'text-red-400' : 'text-white/70'
                  } hover:text-red-400`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs hidden sm:inline">Like</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-1 px-2 py-1 h-8 text-white/70 hover:text-white"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Share</span>
                </Button>
                
                {hasRelatedArticles && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowRelated}
                    className="flex items-center gap-1 px-2 py-1 h-8 text-white/70 hover:text-white relative"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Related</span>
                    {/* Small indicator for related content */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReadOriginal}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center gap-1 px-2 py-1 h-8"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-xs">Read</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles Modal */}
      {showRelatedArticles && hasRelatedArticles && (
        <RelatedArticlesCarousel
          articles={relatedArticles}
          onClose={() => setShowRelatedArticles(false)}
        />
      )}
    </div>
  );
};

export default VideoCard;
