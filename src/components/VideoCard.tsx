
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
  contextualInsights?: string[];
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

      {/* Insights Panel */}
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
