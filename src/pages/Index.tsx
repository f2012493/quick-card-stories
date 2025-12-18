import React from 'react';
import TwitterFeed from '../components/TwitterFeed';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TwitterFeed />
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
