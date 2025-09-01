
import React, { useEffect } from 'react';
import VideoCard from './VideoCard';
import Advertisement from './Advertisement';
import { useTriggerNewsIngestion } from '@/hooks/useTriggerNewsIngestion';
import { useLocation } from '@/hooks/useLocation';
import { toast } from 'sonner';
import RevenueDashboard from './RevenueDashboard';
import { useVideoFeedData } from '@/hooks/useVideoFeedData';
import { useVideoFeedInteractions } from '@/hooks/useVideoFeedInteractions';
import VideoFeedLoadingStates from './VideoFeedLoadingStates';
import VideoFeedProgressIndicator from './VideoFeedProgressIndicator';
import VideoFeedRefreshButton from './VideoFeedRefreshButton';

const VideoFeed = () => {
  const { locationData } = useLocation();
  
  const {
    allNews,
    isInitialLoad,
    isLoadingMore,
    hasMorePages,
    isLoading,
    loadMoreNews,
    createContentArray,
    resetPagination
  } = useVideoFeedData();

  const contentArray = createContentArray();

  const {
    currentIndex,
    isDragging,
    containerRef,
    navigateToArticle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  } = useVideoFeedInteractions(contentArray);

  const triggerIngestion = useTriggerNewsIngestion();

  // Check if we need to load more content based on current position
  useEffect(() => {
    const totalItems = contentArray.length;
    const remainingItems = totalItems - currentIndex;
    
    // Load more when we're within 5 items of the end
    if (remainingItems <= 5 && hasMorePages && !isLoadingMore) {
      loadMoreNews();
    }
  }, [currentIndex, hasMorePages, isLoadingMore, loadMoreNews, contentArray.length]);

  const handleRefreshNews = async () => {
    try {
      console.log('Triggering news refresh...');
      await triggerIngestion.mutateAsync({
        country: locationData?.country,
        countryCode: locationData?.countryCode,
        city: locationData?.city,
        region: locationData?.region
      });
      toast.success('News refresh initiated');
      resetPagination();
    } catch (error) {
      console.error('Failed to refresh news:', error);
      toast.error('Failed to refresh news');
    }
  };

  const hasContent = contentArray.length > 0 && allNews.length > 0;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <VideoFeedLoadingStates
        isInitialLoad={isInitialLoad}
        isLoading={isLoading}
        hasContent={hasContent}
        isLoadingMore={isLoadingMore}
        hasMorePages={hasMorePages}
        allNewsLength={allNews.length}
        onRefreshNews={handleRefreshNews}
      />

      {hasContent && (
        <>
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden snap-y snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {contentArray.map((item, index) => (
              <div
                key={item.type === 'news' ? item.data.id : `ad-${item.data.adIndex}`}
                className="w-full h-screen snap-start snap-always flex-shrink-0"
                style={{
                  transform: `translateY(${(index - currentIndex) * 100}vh)`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
              >
                {item.type === 'news' ? (
                  <VideoCard
                    news={item.data}
                    isActive={index === currentIndex}
                    onNavigateToArticle={navigateToArticle}
                  />
                ) : (
                  <Advertisement index={item.data.adIndex} />
                )}
              </div>
            ))}
          </div>
          
          <VideoFeedProgressIndicator 
            currentIndex={currentIndex}
            contentArray={contentArray}
          />

          <VideoFeedLoadingStates
            isInitialLoad={false}
            isLoading={false}
            hasContent={true}
            isLoadingMore={isLoadingMore}
            hasMorePages={hasMorePages}
            allNewsLength={allNews.length}
            onRefreshNews={handleRefreshNews}
          />

          <VideoFeedRefreshButton
            onRefresh={handleRefreshNews}
            isPending={triggerIngestion.isPending}
          />

          <RevenueDashboard />
        </>
      )}
    </div>
  );
};

export default VideoFeed;
