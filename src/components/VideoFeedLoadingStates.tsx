
import React from 'react';

interface VideoFeedLoadingStatesProps {
  isInitialLoad: boolean;
  isLoading: boolean;
  hasContent: boolean;
  isLoadingMore: boolean;
  hasMorePages: boolean;
  allNewsLength: number;
  onRefreshNews: () => void;
}

const VideoFeedLoadingStates = ({
  isInitialLoad,
  isLoading,
  hasContent,
  isLoadingMore,
  hasMorePages,
  allNewsLength,
  onRefreshNews
}: VideoFeedLoadingStatesProps) => {
  if (isInitialLoad && isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading fresh news...</p>
          <p className="text-sm text-gray-400 mt-2">Fetching from multiple sources</p>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <p>No fresh news available at the moment.</p>
          <p className="text-sm text-gray-400 mt-2">Please check your connection and try again</p>
          <button
            onClick={onRefreshNews}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh News
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-white text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMorePages && allNewsLength > 20 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white/60 text-sm">You've reached the end</span>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoFeedLoadingStates;
