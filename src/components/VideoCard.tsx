
import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';
import VideoCardHeader from './VideoCardHeader';
import VideoCardContent from './VideoCardContent';
import VideoCardSwipeHandler from './VideoCardSwipeHandler';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
  trustScore?: number;
  localRelevance?: number;
}

interface VideoCardProps {
  news: NewsItem;
  isActive: boolean;
  onNavigateToArticle: (articleId: string) => void;
}

const VideoCard = ({ 
  news, 
  isActive, 
  onNavigateToArticle
}: VideoCardProps) => {
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (isActive) {
      analyticsService.startTracking(news.id, 'general');
    }
    
    return () => {
      if (isActive) {
        analyticsService.endTracking(false);
      }
    };
  }, [isActive, news.id]);

  const handleSwipeRight = () => {
    setShowRelatedArticles(true);
  };

  const handleSwipeLeft = () => {
    setShowRelatedArticles(false);
  };

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Main Article View */}
      <div 
        className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
          showRelatedArticles ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Black Background */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Image Background with reduced opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url(${news.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7) contrast(1.1) saturate(1.2)'
          }}
        />
        
        {/* Stronger Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/70" />
        
        {/* Content Overlay */}
        <div className="relative z-20 w-full h-full flex flex-col p-6 pointer-events-none">
          <VideoCardHeader 
            readTime={news.readTime} 
            publishedAt={news.publishedAt} 
          />
          <VideoCardContent 
            news={news}
            showInsights={showInsights}
            onToggleInsights={handleToggleInsights}
          />
        </div>
      </div>

      {/* Article Details Panel */}
      <div 
        className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-black ${
          showRelatedArticles ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <RelatedArticlesCarousel
          currentNews={news}
          onNavigateToArticle={onNavigateToArticle}
          onSwipeLeft={handleSwipeLeft}
        />
      </div>

      <VideoCardSwipeHandler
        showRelatedArticles={showRelatedArticles}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
      />
    </div>
  );
};

export default VideoCard;
