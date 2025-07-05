
import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { contextService } from '@/services/contextService';
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
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
    clusteredArticles?: any[];
  };
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
  const [enhancedNews, setEnhancedNews] = useState<NewsItem>(news);

  useEffect(() => {
    if (isActive) {
      analyticsService.startTracking(news.id, 'general');
      
      // Fetch enhanced contextual info with clustering
      const fetchEnhancedContext = async () => {
        try {
          const contextualInfo = await contextService.fetchContextualInfo(
            news.headline,
            news.tldr,
            news.quote, // Using quote as full content placeholder
            news.id
          );
          
          setEnhancedNews(prev => ({
            ...prev,
            contextualInfo
          }));
        } catch (error) {
          console.error('Error fetching enhanced context:', error);
        }
      };
      
      fetchEnhancedContext();
    }
    
    return () => {
      if (isActive) {
        analyticsService.endTracking(false);
      }
    };
  }, [isActive, news.id, news.headline, news.tldr, news.quote]);

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
        
        {/* Image Background with blur and reduced transparency */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{
            backgroundImage: `url(${enhancedNews.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.8) contrast(1.1) saturate(1.2)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/60" />
        
        {/* Content Overlay */}
        <div className="relative z-20 w-full h-full flex flex-col p-6 pointer-events-none">
          <VideoCardHeader 
            readTime={enhancedNews.readTime} 
            publishedAt={enhancedNews.publishedAt} 
          />
          <VideoCardContent 
            news={enhancedNews}
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
          currentNews={enhancedNews}
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
