import React, { useState, useEffect } from 'react';
import { Share, Heart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analyticsService';

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
  const [isLiked, setIsLiked] = useState(false);

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

  const handleShare = () => {
    if (news.sourceUrl) {
      try {
        navigator.clipboard.writeText(news.sourceUrl);
        toast.success("📋 Link copied to clipboard!");
      } catch (error) {
        // Fallback for cases where clipboard access is restricted
        toast.success("📱 Sharing feature coming soon!");
      }
    } else {
      toast.success("📱 Sharing feature coming soon!");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "💔 Removed from favorites" : "❤️ Added to favorites");
  };

  const handleReadFullArticle = () => {
    if (news.sourceUrl) {
      window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("Source URL not available");
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
      {/* Image Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${news.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8) contrast(1.1) saturate(1.2)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50" />
      
      {/* Content Overlay */}
      <div className="relative z-20 w-full h-full flex flex-col p-6 pointer-events-none">
        {/* Header - Updated to remove News Story box and add more top padding */}
        <div className="flex items-center justify-between mb-4 pt-16">
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

          {/* Read Full Article Button - Removed author section */}
          {news.sourceUrl && (
            <div className="mb-6">
              <button
                onClick={handleReadFullArticle}
                className="flex items-center space-x-2 bg-blue-600/90 hover:bg-blue-700/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 pointer-events-auto backdrop-blur-md shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Read Full Article</span>
              </button>
            </div>
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
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="bg-black/50 hover:bg-black/70 transition-all duration-200 p-3 rounded-full backdrop-blur-md pointer-events-auto shadow-lg"
        >
          <Share className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
