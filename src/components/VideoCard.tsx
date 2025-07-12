
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
import ValueAddedContent from './features/ValueAddedContent';
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

      {/* Content Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          
          {/* Value Added Content */}
          <ValueAddedContent 
            headline={news.headline}
            category={news.category}
            clusterId={news.clusterId}
          />

          {/* Summary Selector */}
          <SummarySelector
            articleId={news.id}
            content={news.fullContent || news.tldr}
            onSummaryChange={handleSummaryChange}
          />

          {/* Article Content */}
          <div className="space-y-4">
            <h1 className="text-white text-xl font-bold leading-tight">
              {news.headline}
            </h1>
            
            <div className="text-white/90 text-base leading-relaxed max-h-40 overflow-y-auto">
              {currentContent}
            </div>

            {/* Article Meta */}
            <div className="flex items-center gap-4 text-white/70 text-sm">
              {news.author && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{news.author}</span>
                </div>
              )}
              {news.publishedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(news.publishedAt)}</span>
                </div>
              )}
              {news.localRelevance && news.localRelevance > 0.5 && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Local</span>
                </div>
              )}
            </div>
          </div>

          {/* Trust Scoring */}
          <TrustScoring articleId={news.id} userId={user?.id} />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className={`flex items-center gap-2 ${
                  isLiked ? 'text-red-400' : 'text-white/70'
                } hover:text-red-400`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">Like</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2 text-white/70 hover:text-white"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </Button>
              
              {news.clusterId && relatedArticles && relatedArticles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowRelated}
                  className="flex items-center gap-2 text-white/70 hover:text-white"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">More Coverage</span>
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReadOriginal}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center gap-2"
            >
              <ExternalLink className="w-3 h-3" />
              Original
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
    </div>
  );
};

export default VideoCard;
