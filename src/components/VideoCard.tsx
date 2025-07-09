
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Info,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useAuth } from '@/contexts/AuthContext';

interface News {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  published_at: string;
  category?: string;
  author?: string;
  source?: {
    name: string;
    domain: string;
  };
  related_articles?: Array<{
    id: string;
    title: string;
    content?: string;
    description?: string;
    url: string;
    image_url?: string;
    author?: string;
    published_at: string;
  }>;
}

interface VideoCardProps {
  news: News;
  isActive: boolean;
  onNavigateToArticle?: (url: string) => void;
}

const VideoCard = ({ news, isActive, onNavigateToArticle }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { trackInteraction } = useUserTracking();
  const { user } = useAuth();

  useEffect(() => {
    if (isActive && isPlaying && videoRef.current) {
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive, isPlaying]);

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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleReadOriginal = () => {
    if (onNavigateToArticle) {
      onNavigateToArticle(news.url);
    } else {
      window.open(news.url, '_blank');
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
        interactionType: 'view'
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card className="relative w-full h-full bg-gradient-to-br from-slate-900 to-black overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: news.image_url ? `url(${news.image_url})` : 'none',
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              {news.category && (
                <Badge variant="secondary" className="w-fit bg-white/20 text-white">
                  {news.category}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                {formatTimeAgo(news.published_at)}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="bg-black/40 text-white hover:bg-black/60"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              {news.related_articles && news.related_articles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowRelated}
                  className="bg-black/40 text-white hover:bg-black/60"
                >
                  <Info className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Center Play Button */}
          <div className="flex-1 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlayPause}
              className="bg-black/40 text-white hover:bg-black/60 p-6 rounded-full"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>
          </div>

          {/* Bottom Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-white text-xl font-bold leading-tight mb-2">
                {news.title}
              </h2>
              {news.description && (
                <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                  {news.description}
                </p>
              )}
            </div>

            {/* Source Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/70 text-sm">
                {news.source && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {news.source.name}
                  </div>
                )}
                {news.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {news.author}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Video Element */}
        <video
          ref={videoRef}
          className="hidden"
          muted={isMuted}
          loop
          playsInline
        />
      </Card>

      {/* Related Articles Modal */}
      {showRelatedArticles && news.related_articles && (
        <RelatedArticlesCarousel
          articles={news.related_articles}
          onClose={() => setShowRelatedArticles(false)}
        />
      )}
    </>
  );
};

export default VideoCard;
