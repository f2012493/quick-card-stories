
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Share, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { audioService } from '@/services/audioService';

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
  const [isLiked, setIsLiked] = useState(false);

  // Clean up audio when component unmounts or news changes
  useEffect(() => {
    return () => {
      audioService.stop();
    };
  }, [news.id]);

  // Stop narration when card becomes inactive
  useEffect(() => {
    if (!isActive && isPlaying) {
      handlePlayPause();
    }
  }, [isActive]);

  const createNarrationText = () => {
    return `Breaking News: ${news.headline}. Here's what you need to know: ${news.tldr}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      try {
        setIsPlaying(true);
        const text = createNarrationText();
        
        await audioService.playNarration({
          text,
          backgroundMusic: true,
          musicVolume: 0.25,
          speechVolume: 1.0
        });
        
        setIsPlaying(false);
      } catch (error) {
        console.error('Narration failed:', error);
        setIsPlaying(false);
        toast.error("Audio playback failed");
      }
    }
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
      {/* Background Image with enhanced quality */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${news.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9) contrast(1.1) saturate(1.2)'
        }}
      />
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
      
      {/* Invisible Play Button (Instagram-style) */}
      <button
        onClick={handlePlayPause}
        className="absolute inset-0 w-full h-full z-10 bg-transparent"
        aria-label={isPlaying ? "Pause narration" : "Play narration"}
      />
      
      {/* Content */}
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
          <div className="mb-6">
            <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
              TL;DR
            </h2>
            <p className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium">
              {news.tldr}
            </p>
          </div>

          {/* Author info if available */}
          {news.author && (
            <p className="text-white/80 text-sm mb-4 font-medium">
              By {news.author}
            </p>
          )}
        </div>
      </div>

      {/* Side Controls (Instagram Reels style) */}
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
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="bg-black/50 hover:bg-black/70 transition-all duration-200 p-3 rounded-full backdrop-blur-md pointer-events-auto shadow-lg"
        >
          <Share className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Play/Pause Indicator (center) */}
      {isPlaying && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 p-6 rounded-full backdrop-blur-md animate-pulse shadow-2xl">
            <Pause className="w-10 h-10 text-white" />
          </div>
        </div>
      )}

      {/* Enhanced Swipe Indicator */}
      {index === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 animate-bounce z-30">
          <div className="text-white/70 text-sm text-center">
            <div className="w-8 h-12 border-2 border-white/50 rounded-full mb-2 mx-auto relative backdrop-blur-sm">
              <div className="w-1 h-3 bg-white/70 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
            </div>
            Swipe up for next
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
