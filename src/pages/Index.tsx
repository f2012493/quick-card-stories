
import React from 'react';
import NewsFeed from '../components/NewsFeed';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <NewsFeed />
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
