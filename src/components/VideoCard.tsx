
import React, { useState, useEffect, useRef } from 'react';
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
  onTap?: () => void;
}

const VideoCard = ({ news, isActive, index, onTap }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up speech synthesis when component unmounts or news changes
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [news.id]);

  // Stop narration when card becomes inactive
  useEffect(() => {
    if (!isActive && isPlaying) {
      handlePlayPause();
    }
  }, [isActive]);

  const createNarrationText = () => {
    return `${news.headline}. ${news.tldr}`;
  };

  const handlePlayPause = () => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }

    if (isPlaying) {
      // Stop narration
      speechSynthesis.cancel();
      setIsPlaying(false);
      toast.info("🔇 AI narration stopped");
    } else {
      // Start narration
      if (isMuted) {
        setIsMuted(false);
        toast.info("🔊 Audio enabled - starting narration");
      }

      const text = createNarrationText();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech settings
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        toast.success("🎬 AI narration started");
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        toast.info("🎬 AI narration completed");
      };
      
      utterance.onerror = (event) => {
        setIsPlaying(false);
        toast.error("Error during narration: " + event.error);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const handleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState && isPlaying) {
      // If muting while playing, stop the narration
      speechSynthesis.cancel();
      setIsPlaying(false);
      toast.info("🔇 Audio muted - narration stopped");
    } else {
      toast.info(newMutedState ? "🔇 Audio muted" : "🔊 Audio enabled");
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

  const handleCardTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent tap if user is interacting with buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // Call parent tap handler for play/pause
    if (onTap) {
      onTap();
    } else {
      handlePlayPause();
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
    <div 
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      onClick={handleCardTap}
      onTouchEnd={handleCardTap}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${news.imageUrl})`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-safe">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
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
        <div className="flex-1 flex flex-col justify-end pb-20 sm:pb-24">          
          {/* Headline */}
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-3 sm:mb-4">
            {news.headline}
          </h1>

          {/* TL;DR */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              TL;DR
            </h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              {news.tldr}
            </p>
          </div>

          {/* Read More Button */}
          {news.sourceUrl && (
            <button
              onClick={handleReadMore}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 transition-colors px-3 sm:px-4 py-2 rounded-full text-white text-sm mb-4 backdrop-blur-sm border border-white/20 w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Read Full Article</span>
            </button>
          )}
        </div>

        {/* Controls - Fixed at bottom with safe area padding */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {/* Play Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="bg-blue-500 hover:bg-blue-600 transition-colors p-3 sm:p-3 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMute();
              }}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 sm:p-2 rounded-full backdrop-blur-sm"
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
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`p-2 sm:p-2 rounded-full transition-all ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              } backdrop-blur-sm`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 sm:p-2 rounded-full backdrop-blur-sm"
            >
              <Share className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Indicator */}
      {index === 0 && (
        <div className="absolute bottom-32 sm:bottom-36 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="text-white/60 text-sm text-center">
            <div className="w-6 h-10 sm:w-8 sm:h-12 border-2 border-white/40 rounded-full mb-2 mx-auto relative">
              <div className="w-1 h-2 sm:h-3 bg-white/60 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
            </div>
            Swipe up for next story
          </div>
        </div>
      )}

      {/* Play Indicator */}
      {isPlaying && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-4">
            <div className="w-8 h-8 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
