import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import RelatedArticlesCarousel from './RelatedArticlesCarousel';

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
  trustScore?: number;
  localRelevance?: number;
  contextualInsights?: string[];
}

interface VideoCardProps {
  news: NewsItem;
  isActive: boolean;
  index: number;
  allNews: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
  readingSpeed?: number;
}

const VideoCard = ({ 
  news, 
  isActive, 
  index, 
  allNews, 
  onNavigateToArticle,
  readingSpeed = 1 
}: VideoCardProps) => {
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

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

  const formatPublishedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleSwipeRight = () => {
    setShowRelatedArticles(true);
  };

  const handleSwipeLeft = () => {
    setShowRelatedArticles(false);
  };

  const relatedArticles = allNews.filter(article => article.id !== news.id);

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
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-safe">
            <div className="flex items-center space-x-3">
              <span className="text-white/70 text-xs font-medium">{news.readTime}</span>
              {news.publishedAt && (
                <span className="text-white/70 text-xs">{formatPublishedDate(news.publishedAt)}</span>
              )}
              <span className="text-blue-400 text-xs font-medium">{news.category}</span>
            </div>
            <div className="text-white/60 text-xs font-medium">antiNews</div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-end pb-32 md:pb-24">
            {/* Headline */}
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-2xl">
              {news.headline}
            </h1>

            {/* TL;DR */}
            <div className="mb-6">
              <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
                TL;DR
              </h2>
              <p 
                className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium"
                style={{
                  animationDuration: `${3 / readingSpeed}s`
                }}
              >
                {news.tldr}
              </p>
            </div>

            {/* Why This Matters - Enhanced for antiNews */}
            <div className="mb-6">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-yellow-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg pointer-events-auto flex items-center gap-1"
              >
                Why This Matters {showInsights ? '▼' : '▶'}
              </button>
              {showInsights && (
                <div className="space-y-2">
                  {(news.contextualInsights && news.contextualInsights.length > 0 ? news.contextualInsights : [
                    'This story impacts how we understand current events and their broader implications',
                    'Understanding these developments helps us make more informed decisions as citizens'
                  ]).slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-white/90 text-sm leading-relaxed drop-shadow-lg bg-black/20 p-3 rounded-md">
                      • {insight}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Author */}
            <div className="mb-4">
              <p className="text-white/60 text-sm">By {news.author}</p>
              {(news.localRelevance || 0) > 0.7 && (
                <p className="text-green-400 text-xs mt-1">📍 High local relevance</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Panel - Full screen overlay */}
      <div 
        className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-black ${
          showRelatedArticles ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <RelatedArticlesCarousel
          currentNews={news}
          relatedArticles={relatedArticles}
          onNavigateToArticle={onNavigateToArticle}
          onSwipeLeft={handleSwipeLeft}
        />
      </div>

      {/* Touch handlers for swiping */}
      <div
        className="absolute inset-0 z-30 touch-manipulation"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.target as any).startX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const startX = (e.target as any).startX;
          const deltaX = touch.clientX - startX;
          
          if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && showRelatedArticles) {
              handleSwipeLeft();
            } else if (deltaX < 0 && !showRelatedArticles) {
              handleSwipeRight();
            }
          }
        }}
      />

      {/* Swipe indicator */}
      {!showRelatedArticles && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 text-white/60">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Swipe left</span>
            <span className="text-lg">→</span>
            <span className="text-xs mt-1">for insights</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
