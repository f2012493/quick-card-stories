
import React from 'react';
import VideoFeed from '../components/VideoFeed';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <VideoFeed />
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
