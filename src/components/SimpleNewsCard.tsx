import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, User } from 'lucide-react';

interface News {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

interface SimpleNewsCardProps {
  news: News;
  isActive: boolean;
  onNavigateToArticle: (url: string) => void;
}

const SimpleNewsCard = ({ news, isActive, onNavigateToArticle }: SimpleNewsCardProps) => {
  const handleReadOriginal = () => {
    if (news.sourceUrl) {
      if (onNavigateToArticle) {
        onNavigateToArticle(news.sourceUrl);
      } else {
        window.open(news.sourceUrl, '_blank');
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {news.imageUrl ? (
          <img
            src={news.imageUrl}
            alt={news.headline}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-background/10" />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {news.publishedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(news.publishedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="px-4 pb-32 pt-20 space-y-6">
          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-foreground text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {news.headline}
            </h1>
            
            {/* TLDR Summary */}
            <div className="bg-background/40 backdrop-blur-lg border border-border rounded-2xl p-4">
              <p className="text-foreground/90 text-base leading-relaxed">
                {news.tldr}
              </p>
            </div>

            {/* Author info */}
            {news.author && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{news.author}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-sm">{news.readTime}</span>
              </div>
            )}
          </div>

          {/* Read Full Article Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleReadOriginal}
              className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Read Full Article</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleNewsCard;