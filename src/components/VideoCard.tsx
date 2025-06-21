
import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Share, Heart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

interface VideoCardProps {
  news: NewsItem;
  isActive: boolean;
  index: number;
}

const VideoCard = ({ news, isActive, index }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.success("🎬 AI narration would start playing here!");
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? "🔊 Audio enabled" : "🔇 Audio muted");
  };

  const handleShare = () => {
    if (news.sourceUrl) {
      navigator.clipboard.writeText(news.sourceUrl);
      toast.success("📱 News link copied to clipboard!");
    } else {
      toast.success("📱 Sharing feature coming soon!");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "💔 Removed from favorites" : "❤️ Added to favorites");
  };

  const handleReadMore = () => {
    if (news.sourceUrl) {
      window.open(news.sourceUrl, '_blank');
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
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${news.imageUrl})`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-safe">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              news.category === 'Tech' ? 'bg-blue-500/20 text-blue-400' :
              news.category === 'Politics' ? 'bg-red-500/20 text-red-400' :
              news.category === 'Business' ? 'bg-green-500/20 text-green-400' :
              news.category === 'Health' ? 'bg-purple-500/20 text-purple-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {news.category}
            </div>
            <span className="text-white/60 text-xs">{news.readTime}</span>
            {news.publishedAt && (
              <span className="text-white/60 text-xs">{formatPublishedDate(news.publishedAt)}</span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Quote Section */}
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-white/90 text-lg italic leading-relaxed">
                {news.quote}
              </p>
              <p className="text-white/60 text-sm mt-2">— {news.author}</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
            {news.headline}
          </h1>

          {/* TL;DR */}
          <div className="mb-6">
            <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              TL;DR
            </h2>
            <p className="text-white/90 text-base leading-relaxed">
              {news.tldr}
            </p>
          </div>

          {/* Read More Button */}
          {news.sourceUrl && (
            <button
              onClick={handleReadMore}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full text-white text-sm mb-4 backdrop-blur-sm border border-white/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Read Full Article</span>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pb-safe">
          {/* Play Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="bg-blue-500 hover:bg-blue-600 transition-colors p-3 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={handleMute}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-all ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              } backdrop-blur-sm`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-sm"
            >
              <Share className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Indicator */}
      {index === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="text-white/60 text-sm text-center">
            <div className="w-8 h-12 border-2 border-white/40 rounded-full mb-2 mx-auto relative">
              <div className="w-1 h-3 bg-white/60 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
            </div>
            Swipe up for next story
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
