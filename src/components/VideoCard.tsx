
import React, { useState, useEffect, useRef } from 'react';
import { Share, Heart, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analyticsService';
import NewsDetailPanel from './NewsDetailPanel';

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
  videoUrl?: string;
}

interface VideoCardProps {
  news: NewsItem;
  isActive: boolean;
  index: number;
}

const VideoCard = ({ news, isActive, index }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Track time spent on this card
  useEffect(() => {
    if (isActive) {
      analyticsService.startTracking(news.id, news.category);
    }
    
    return () => {
      if (isActive) {
        analyticsService.endTracking(false);
      }
    };
  }, [isActive, news.id, news.category]);

  // Handle video autoplay when card becomes active
  useEffect(() => {
    if (isActive && iframeRef.current && news.videoUrl) {
      // Update iframe src to include autoplay parameter
      const videoUrl = new URL(news.videoUrl);
      videoUrl.searchParams.set('autoplay', '1');
      videoUrl.searchParams.set('mute', isMuted ? '1' : '0');
      
      iframeRef.current.src = videoUrl.toString();
    } else if (!isActive && iframeRef.current) {
      // Pause video when not active
      const videoUrl = new URL(news.videoUrl || '');
      videoUrl.searchParams.set('autoplay', '0');
      
      iframeRef.current.src = videoUrl.toString();
    }
  }, [isActive, news.videoUrl, isMuted]);

  const handleShare = () => {
    if (news.sourceUrl) {
      navigator.clipboard.writeText(news.sourceUrl);
      toast.success("📋 Link copied to clipboard!");
    } else {
      toast.success("📱 Sharing feature coming soon!");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "💔 Removed from favorites" : "❤️ Added to favorites");
  };

  const handleExplore = () => {
    setShowDetailPanel(true);
    analyticsService.markAsExplored();
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
  };

  const handleAnalyze = (newsId: string) => {
    console.log(`Analyzing news: ${newsId}`);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? "🔊 Sound enabled" : "🔇 Sound muted");
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
    <>
      <div className="relative w-full h-screen flex items-center justify-center">
        {/* Video Background */}
        {news.videoUrl ? (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={`${news.videoUrl}&autoplay=${isActive ? '1' : '0'}&mute=${isMuted ? '1' : '0'}`}
            title={news.headline}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // Fallback to image background if no video
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${news.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.9) contrast(1.1) saturate(1.2)'
              }}
            />
            {/* Gradient Overlay for image fallback */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
          </>
        )}
        
        {/* Content Overlay */}
        <div className="relative z-20 w-full h-full flex flex-col p-6 pointer-events-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-safe">
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                news.category === 'Tech' ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' :
                news.category === 'Politics' ? 'bg-red-500/30 text-red-300 border border-red-400/50' :
                news.category === 'Business' ? 'bg-green-500/30 text-green-300 border border-green-400/50' :
                news.category === 'Health' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50' :
                'bg-gray-500/30 text-gray-300 border border-gray-400/50'
              }`}>
                {news.category}
              </div>
              <span className="text-white/70 text-xs font-medium">{news.readTime}</span>
              {news.publishedAt && (
                <span className="text-white/70 text-xs">{formatPublishedDate(news.publishedAt)}</span>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-end">
            {/* Headline */}
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-2xl">
              {news.headline}
            </h1>

            {/* TL;DR */}
            <div className="mb-4">
              <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
                TL;DR
              </h2>
              <p className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium">
                {news.tldr}
              </p>
            </div>

            {/* Explore Button */}
            <button
              onClick={handleExplore}
              className="self-start mb-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-medium border border-white/30 hover:bg-white/30 transition-all duration-200 pointer-events-auto flex items-center space-x-2"
            >
              <ChevronUp className="w-4 h-4" />
              <span>Related Coverage</span>
            </button>

            {/* Author info */}
            {news.author && (
              <p className="text-white/80 text-sm font-medium">
                By {news.author}
              </p>
            )}
          </div>
        </div>

        {/* Side Controls */}
        <div className="absolute right-4 bottom-20 z-30 flex flex-col space-y-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`p-3 rounded-full transition-all duration-200 pointer-events-auto backdrop-blur-md shadow-lg ${
              isLiked 
                ? 'bg-red-500/90 text-white scale-110' 
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Mute/Unmute Button */}
          <button
            onClick={handleMuteToggle}
            className={`p-3 rounded-full transition-all duration-200 pointer-events-auto backdrop-blur-md shadow-lg ${
              !isMuted 
                ? 'bg-black/50 text-white hover:bg-black/70' 
                : 'bg-red-500/90 text-white'
            }`}
          >
            {!isMuted ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>
          
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="bg-black/50 hover:bg-black/70 transition-all duration-200 p-3 rounded-full backdrop-blur-md pointer-events-auto shadow-lg"
          >
            <Share className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Video indicator */}
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-xs border border-white/20">
            {news.videoUrl ? '📹 AI Video Story' : '📰 News Story'}
          </div>
        </div>
      </div>

      {/* News Detail Panel */}
      <NewsDetailPanel
        news={news}
        isOpen={showDetailPanel}
        onClose={handleCloseDetail}
        onAnalyze={handleAnalyze}
      />
    </>
  );
};

export default VideoCard;
