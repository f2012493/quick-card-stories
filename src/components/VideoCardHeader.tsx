
import React from 'react';

interface VideoCardHeaderProps {
  readTime?: string;
  publishedAt?: string;
}

const VideoCardHeader = ({ readTime = "2-3 min read", publishedAt }: VideoCardHeaderProps) => {
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
    <div className="flex items-center justify-between mb-4 pt-safe">
      <div className="flex items-center space-x-3">
        <span className="text-white/70 text-xs font-medium">{readTime}</span>
        {publishedAt && (
          <span className="text-white/70 text-xs">{formatPublishedDate(publishedAt)}</span>
        )}
      </div>
      <div className="text-white/60 text-xs font-medium">antiNews</div>
    </div>
  );
};

export default VideoCardHeader;
