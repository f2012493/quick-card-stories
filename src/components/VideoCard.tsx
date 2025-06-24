
import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analyticsService';
import RelatedCoverageModal from './RelatedCoverageModal';

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
  allNews: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
}

const VideoCard = ({ news, isActive, index, allNews, onNavigateToArticle }: VideoCardProps) => {
  const [showRelatedModal, setShowRelatedModal] = useState(false);

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

  const handleReadFullCoverage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setShowRelatedModal(true);
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
    <>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-safe">
            <div className="flex items-center space-x-3">
              <span className="text-white/70 text-xs font-medium">{news.readTime}</span>
              {news.publishedAt && (
                <span className="text-white/70 text-xs">{formatPublishedDate(news.publishedAt)}</span>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-end pb-40 md:pb-32">
            {/* Headline */}
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4 drop-shadow-2xl">
              {news.headline}
            </h1>

            {/* TL;DR */}
            <div className="mb-8">
              <h2 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
                TL;DR
              </h2>
              <p className="text-white/95 text-base leading-relaxed drop-shadow-lg font-medium">
                {news.tldr}
              </p>
            </div>

            {/* Read Full Coverage Button */}
            <div className="mb-4">
              <button
                onClick={handleReadFullCoverage}
                onTouchStart={handleReadFullCoverage}
                className="flex items-center space-x-2 bg-blue-600/90 hover:bg-blue-700/90 active:bg-blue-800/90 text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 pointer-events-auto backdrop-blur-md shadow-lg touch-manipulation select-none"
                style={{ touchAction: 'manipulation' }}
              >
                <ExternalLink className="w-4 h-4" />
                <span>Read Full Coverage</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Coverage Modal */}
      <RelatedCoverageModal 
        isOpen={showRelatedModal}
        onClose={() => setShowRelatedModal(false)}
        currentNews={news}
        allNews={allNews}
        onNavigateToArticle={onNavigateToArticle}
      />
    </>
  );
};

export default VideoCard;
