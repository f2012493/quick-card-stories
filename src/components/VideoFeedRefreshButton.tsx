
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface VideoFeedRefreshButtonProps {
  onRefresh: () => void;
  isPending: boolean;
}

const VideoFeedRefreshButton = ({ onRefresh, isPending }: VideoFeedRefreshButtonProps) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={onRefresh}
        disabled={isPending}
        className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/80 hover:text-white hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
        title="Refresh news feed"
      >
        <RefreshCw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default VideoFeedRefreshButton;
