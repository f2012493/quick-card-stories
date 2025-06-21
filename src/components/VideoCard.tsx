import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Share, Heart } from 'lucide-react';
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
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (isMuted) {
        toast.info("🔊 Tap volume to enable audio");
        return;
      }

      const text = createNarrationText();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const handleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState && isPlaying) {
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
      {/* Background Image with better quality */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${news.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      
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
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              news.category === 'Tech' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
              news.category === 'Politics' ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
              news.category === 'Business' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
              news.category === 'Health' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-400/30'
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
          {/* Headline */}
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-lg">
            {news.headline}
          </h1>

          {/* TL;DR */}
          <div className="mb-6">
            <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              TL;DR
            </h2>
            <p className="text-white/90 text-base leading-relaxed drop-shadow-md">
              {news.tldr}
            </p>
          </div>

          {/* Author info if available */}
          {news.author && (
            <p className="text-white/70 text-sm mb-4">
              By {news.author}
            </p>
          )}
        </div>
      </div>

      {/* Side Controls (Instagram Reels style) */}
      <div className="absolute right-4 bottom-20 z-30 flex flex-col space-y-6">
        {/* Volume Control */}
        <button
          onClick={handleMute}
          className="bg-black/40 hover:bg-black/60 transition-colors p-3 rounded-full backdrop-blur-sm pointer-events-auto"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`p-3 rounded-full transition-all pointer-events-auto ${
            isLiked 
              ? 'bg-red-500 text-white scale-110' 
              : 'bg-black/40 text-white hover:bg-black/60'
          } backdrop-blur-sm`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="bg-black/40 hover:bg-black/60 transition-colors p-3 rounded-full backdrop-blur-sm pointer-events-auto"
        >
          <Share className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Play/Pause Indicator (center) */}
      {isPlaying && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm animate-pulse">
            <Pause className="w-8 h-8 text-white" />
          </div>
        </div>
      )}

      {/* Swipe Indicator */}
      {index === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 animate-bounce z-30">
          <div className="text-white/60 text-sm text-center">
            <div className="w-8 h-12 border-2 border-white/40 rounded-full mb-2 mx-auto relative">
              <div className="w-1 h-3 bg-white/60 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
            </div>
            Swipe up for next
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
