
import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { contextService } from '@/services/contextService';
import VideoCardHeader from './VideoCardHeader';
import VideoCardContent from './VideoCardContent';
import VideoCardSwipeHandler from './VideoCardSwipeHandler';
import ValueAddedContent from './features/ValueAddedContent';

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
  clusterId?: string;
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
            news.quote,
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

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
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
        
        <div className="flex-1 flex flex-col justify-end pb-32 md:pb-24">
          {/* Headline */}
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-2xl">
            {enhancedNews.headline}
          </h1>

          {/* TL;DR */}
          <div className="mb-6">
            <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
              TL;DR
            </h2>
            <p className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium">
              {enhancedNews.tldr}
            </p>
          </div>

          {/* Real Backend Data */}
          <ValueAddedContent 
            headline={enhancedNews.headline} 
            category={enhancedNews.contextualInfo?.topic || 'general'}
            clusterId={enhancedNews.clusterId}
          />

          {/* Author and Source Link */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-white/60 text-sm">By {enhancedNews.author}</p>
            {enhancedNews.sourceUrl && (
              <a
                href={enhancedNews.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium underline decoration-blue-400/50 hover:decoration-blue-300 min-h-[44px] px-3 py-2 rounded touch-manipulation bg-black/20 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Opening link:', enhancedNews.sourceUrl);
                  window.open(enhancedNews.sourceUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Read Full</span>
              </a>
            )}
          </div>

          {/* Source Reliability and Local Relevance */}
          <div className="mb-4 space-y-3">
            {/* Source Reliability */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-xs font-medium">Source Reliability</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-300"
                    style={{ width: `${Math.round((enhancedNews.trustScore || 0.8) * 100)}%` }}
                  />
                </div>
                <span className="text-green-400 text-xs font-semibold min-w-[32px]">
                  {Math.round((enhancedNews.trustScore || 0.8) * 100)}%
                </span>
              </div>
            </div>
            
            {/* Local Relevance */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-xs font-medium">Local Relevance</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${Math.round((enhancedNews.localRelevance || 0.6) * 100)}%` }}
                  />
                </div>
                <span className="text-blue-400 text-xs font-semibold min-w-[32px]">
                  {Math.round((enhancedNews.localRelevance || 0.6) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Reading Time and Quick Actions */}
          <div className="flex items-center justify-between text-white/60 text-xs">
            <span>2-3 min read</span>
            <div className="flex gap-3">
              <button className="hover:text-white transition-colors">Share</button>
              <button className="hover:text-white transition-colors">Save</button>
            </div>
          </div>
        </div>
      </div>

      <VideoCardSwipeHandler
        showRelatedArticles={false}
        onSwipeRight={() => {}}
        onSwipeLeft={() => {}}
      />
    </div>
  );
};

export default VideoCard;
