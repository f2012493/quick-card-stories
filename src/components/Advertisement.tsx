
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AdvertisementProps {
  index: number;
}

const Advertisement = ({ index }: AdvertisementProps) => {
  // Sample advertisement data - in a real app, this would come from an ad service
  const ads = [
    {
      title: "Discover New Perspectives",
      description: "Stay informed with breaking news from around the world",
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
      ctaText: "Learn More",
      link: "#"
    },
    {
      title: "Premium News Experience",
      description: "Get unlimited access to in-depth analysis and exclusive content",
      imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop",
      ctaText: "Try Premium",
      link: "#"
    },
    {
      title: "Stay Connected",
      description: "Never miss important updates with our notification system",
      imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop",
      ctaText: "Enable Notifications",
      link: "#"
    }
  ];

  const ad = ads[index % ads.length];

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Ad Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${ad.imageUrl})`,
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

        {/* Ad Content */}
        <div className="text-center max-w-md">
          <h2 className="text-white text-3xl font-bold mb-4 drop-shadow-2xl">
            {ad.title}
          </h2>
          <p className="text-white/90 text-lg mb-8 leading-relaxed drop-shadow-lg">
            {ad.description}
          </p>
          <button 
            onClick={() => window.open(ad.link, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-lg"
          >
            {ad.ctaText}
          </button>
        </div>

        {/* Skip Ad Option */}
        <div className="absolute bottom-6 right-6">
          <span className="text-white/60 text-sm">
            Swipe to continue →
          </span>
        </div>
      </div>
    </div>
  );
};

export default Advertisement;
