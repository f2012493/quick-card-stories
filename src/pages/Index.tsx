import React from 'react';
import TwitterFeed from '../components/TwitterFeed';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <>
      <TwitterFeed />
      <Toaster position="top-center" />
    </>
  );
};

export default Index;
