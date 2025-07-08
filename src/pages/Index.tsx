
import React from 'react';
import VideoFeed from '../components/VideoFeed';
import SEO from '../components/SEO';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <>
      <SEO
        title="antiNews - Breaking News & AI-Curated Stories"
        description="Stay informed with AI-curated breaking news, analysis, and insights from trusted global sources. Get meaningful news without the noise."
        keywords="breaking news, AI news curation, world news, politics, business, technology, real-time news, news analysis"
        type="website"
      />
      <div className="min-h-screen bg-black overflow-hidden">
        <VideoFeed />
        <Toaster position="top-center" />
      </div>
    </>
  );
};

export default Index;
