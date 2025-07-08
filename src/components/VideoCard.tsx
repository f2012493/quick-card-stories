
import React from 'react';
import VideoCardHeader from './VideoCardHeader';
import VideoCardContent from './VideoCardContent';
import VideoCardSwipeHandler from './VideoCardSwipeHandler';
import { NewsItem } from '@/types/news';

interface VideoCardProps {
  item: NewsItem;
  isActive: boolean;
  onSwipe: (direction: 'up' | 'down') => void;
  clusterId?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ item, isActive, onSwipe, clusterId }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": item.headline,
    "description": item.tldr,
    "image": item.imageUrl,
    "datePublished": item.publishedAt,
    "author": {
      "@type": "Organization", 
      "name": item.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "antiNews",
      "logo": {
        "@type": "ImageObject",
        "url": "https://antinews.lovable.app/logo.png"
      }
    },
    "url": item.sourceUrl
  };

  return (
    <article 
      className="w-full h-full flex flex-col relative bg-black text-white snap-start"
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <VideoCardSwipeHandler onSwipe={onSwipe} isActive={isActive}>
        <div className="absolute inset-0">
          <img
            src={item.imageUrl}
            alt={item.headline}
            className="w-full h-full object-cover"
            loading={isActive ? "eager" : "lazy"}
            itemProp="image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <VideoCardHeader 
            readTime={item.readTime}
            publishedAt={item.publishedAt}
          />
          <VideoCardContent 
            item={item} 
            clusterId={clusterId}
          />
        </div>
      </VideoCardSwipeHandler>
    </article>
  );
};

export default VideoCard;
