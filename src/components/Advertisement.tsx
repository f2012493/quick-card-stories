
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adService } from '@/services/adService';

interface AdUnit {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  link: string;
  revenue: number;
  category?: string;
}

interface AdvertisementProps {
  index: number;
}

const Advertisement = ({ index }: AdvertisementProps) => {
  const [ads, setAds] = useState<AdUnit[]>([]);
  const [currentAd, setCurrentAd] = useState<AdUnit | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    const loadAds = async () => {
      try {
        const fetchedAds = await adService.fetchAds();
        setAds(fetchedAds);
        
        if (fetchedAds.length > 0) {
          const ad = fetchedAds[index % fetchedAds.length];
          setCurrentAd(ad);
        }
      } catch (error) {
        console.error('Failed to load ads:', error);
        // Fallback to default ad
        const fallbackAd: AdUnit = {
          id: 'fallback_001',
          title: "Stay Updated",
          description: "Don't miss the latest news and updates",
          imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
          ctaText: "Learn More",
          link: "#",
          revenue: 10
        };
        setCurrentAd(fallbackAd);
      }
    };

    loadAds();
  }, [index]);

  // Track ad impression when component becomes visible
  useEffect(() => {
    if (currentAd && !hasTrackedView) {
      // Track the impression
      adService.trackImpression(currentAd.id, currentAd.revenue);
      setHasTrackedView(true);
      console.log(`Ad view tracked: ${currentAd.title} - Revenue: $${currentAd.revenue / 100}`);
    }
  }, [currentAd, hasTrackedView]);

  const handleAdClick = () => {
    if (currentAd) {
      // Track the click for additional revenue
      adService.trackClick(currentAd.id);
      
      // Open the ad link
      if (currentAd.link !== '#') {
        window.open(currentAd.link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (!currentAd) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading advertisement...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Ad Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${currentAd.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7) contrast(1.1)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
      
      {/* Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-center items-center p-6">
        {/* Advertisement Label */}
        <div className="absolute top-6 left-6">
          <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
            Advertisement
          </span>
        </div>

        {/* Revenue Indicator (for demonstration) */}
        <div className="absolute top-6 right-6">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            +${(currentAd.revenue / 100).toFixed(2)}
          </span>
        </div>

        {/* Ad Content */}
        <div className="text-center max-w-md">
          <h2 className="text-white text-3xl font-bold mb-4 drop-shadow-2xl">
            {currentAd.title}
          </h2>
          <p className="text-white/90 text-lg mb-8 leading-relaxed drop-shadow-lg">
            {currentAd.description}
          </p>
          <button 
            onClick={handleAdClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-lg hover:scale-105 transform"
          >
            {currentAd.ctaText}
          </button>
        </div>

        {/* Skip Ad Option */}
        <div className="absolute bottom-6 right-6">
          <span className="text-white/60 text-sm">
            Swipe to continue →
          </span>
        </div>

        {/* Ad Category */}
        {currentAd.category && (
          <div className="absolute bottom-6 left-6">
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">
              {currentAd.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Advertisement;
