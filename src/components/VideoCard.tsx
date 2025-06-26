
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
  whyItMatters?: string;
}

interface VideoCardProps {
  news: NewsItem;
  isActive: boolean;
  index: number;
  allNews: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
  readingSpeed?: number;
  onCreateExplainer?: () => void;
}

const VideoCard = ({ 
  news, 
  isActive, 
  index, 
  allNews, 
  onNavigateToArticle,
  readingSpeed = 1,
  onCreateExplainer
}: VideoCardProps) => {
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);

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
            filter: 'brightness(0.7) contrast(1.1) saturate(1.2)'
          }}
        />
        
        {/* Gradient Overlay - Enhanced for mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        
        {/* Content Overlay - Mobile Optimized */}
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-4 safe-area-inset">
          {/* Header - Mobile Optimized */}
          <div className="flex items-center justify-between pt-2 flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-blue-500/80 text-white px-2 py-1 rounded-full font-medium">
                {news.category}
              </span>
              <span className="text-white/80">{news.readTime}</span>
              {news.publishedAt && (
                <span className="text-white/70">{formatPublishedDate(news.publishedAt)}</span>
              )}
            </div>
          </div>

          {/* Main Content Area - Mobile Optimized */}
          <div className="flex-1 flex flex-col justify-end pb-24 space-y-4">
            {/* Headline - Mobile Typography */}
            <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold leading-tight drop-shadow-2xl">
              {news.headline}
            </h1>

            {/* TL;DR - Mobile Optimized */}
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border-l-4 border-blue-400">
              <h2 className="text-blue-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                TL;DR
              </h2>
              <p className="text-white/95 text-sm leading-relaxed font-medium">
                {news.tldr}
              </p>
            </div>

            {/* Why It Matters Section - Mobile Optimized */}
            {news.whyItMatters && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border-l-4 border-green-400">
                <h2 className="text-green-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                  Why This Matters
                </h2>
                <p className="text-white/95 text-sm leading-relaxed font-medium">
                  {news.whyItMatters}
                </p>
              </div>
            )}

            {/* Quote/Stat - Mobile Optimized */}
            {news.quote && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-white/95 text-sm italic">
                  "{news.quote}"
                </p>
              </div>
            )}

            {/* Author - Mobile Optimized */}
            <div className="text-center">
              <p className="text-white/60 text-xs">By {news.author}</p>
            </div>
          </div>

          {/* CTA Button - Mobile Optimized */}
          {onCreateExplainer && (
            <div className="flex-shrink-0 pb-4">
              <button
                onClick={onCreateExplainer}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform active:scale-95 text-sm sm:text-base"
              >
                Create Your Own Explainer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related Articles Carousel */}
      <div 
        className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
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
    </div>
  );
};

export default VideoCard;
