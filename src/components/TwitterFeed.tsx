import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, ExternalLink, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNews } from '@/hooks/useNews';
import { useLocation } from '@/hooks/useLocation';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useAuth } from '@/contexts/AuthContext';

interface NewsPost {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  publishedAt?: string;
  sourceUrl?: string;
}
const TwitterFeed = () => {
  const [displayedNews, setDisplayedNews] = useState<NewsPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  const { locationData } = useLocation();
  const { trackInteraction } = useUserTracking();
  const { user } = useAuth();

  const { data: newsData = [], isLoading, refetch } = useNews({
    category: 'general',
    pageSize: 50,
    country: locationData?.country,
  });

  // Initialize with first 10 posts
  useEffect(() => {
    if (newsData.length > 0) {
      const realNews = newsData.filter(article => 
        article.author !== 'antiNews System' && 
        !article.headline.includes('Breaking: Real-time News Service')
      );
      setDisplayedNews(realNews.slice(0, POSTS_PER_PAGE));
    }
  }, [newsData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    const realNews = newsData.filter(article => 
      article.author !== 'antiNews System'
    );
    const nextPage = page + 1;
    const newPosts = realNews.slice(0, nextPage * POSTS_PER_PAGE);
    
    setTimeout(() => {
      setDisplayedNews(newPosts);
      setPage(nextPage);
      setIsLoadingMore(false);
    }, 500);
  }, [newsData, page, isLoadingMore]);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    
    if (user) {
      trackInteraction.mutate({
        userId: user.id,
        articleId: postId,
        interactionType: 'like'
      });
    }
  };

  const handleShare = async (post: NewsPost) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.headline,
          text: post.tldr,
          url: post.sourceUrl || window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(post.sourceUrl || window.location.href);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getAuthorInitials = (author: string) => {
    return author
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasMore = displayedNews.length < newsData.filter(a => a.author !== 'antiNews System').length;

  if (isLoading && displayedNews.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-border">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">News Feed</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-border">
          {displayedNews.map((post) => (
            <article 
              key={post.id} 
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={post.imageUrl} alt={post.author} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getAuthorInitials(post.author || 'News')}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-foreground truncate max-w-[180px]">
                        {post.author || 'Unknown Source'}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        @{(post.author || 'news').toLowerCase().replace(/\s+/g, '')}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(post.publishedAt)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Headline */}
                  <h2 className="text-foreground font-medium mt-1 leading-snug">
                    {post.headline}
                  </h2>

                  {/* Content */}
                  <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">
                    {post.tldr}
                  </p>

                  {/* Image preview */}
                  {post.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border">
                      <img
                        src={post.imageUrl}
                        alt={post.headline}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 max-w-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 px-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{Math.floor(Math.random() * 50)}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(post.id);
                      }}
                      className={`gap-1.5 px-2 ${
                        likedPosts.has(post.id)
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10'
                          : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      <span className="text-xs">{Math.floor(Math.random() * 200)}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post);
                      }}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 px-2"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    {post.sourceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(post.sourceUrl, '_blank');
                        }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 px-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}

        {/* End of feed */}
        {!hasMore && displayedNews.length > 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterFeed;
