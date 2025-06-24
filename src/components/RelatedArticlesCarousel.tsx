
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

interface RelatedArticlesCarouselProps {
  currentNews: NewsItem;
  relatedArticles: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
  onSwipeLeft: () => void;
}

const RelatedArticlesCarousel = ({ 
  currentNews, 
  relatedArticles, 
  onNavigateToArticle, 
  onSwipeLeft 
}: RelatedArticlesCarouselProps) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleNextCard = () => {
    if (currentCardIndex < 2) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      onSwipeLeft();
    }
  };

  const cards = [
    {
      title: "Card 1",
      content: (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Empty Card 1</div>
        </div>
      )
    },
    {
      title: "Card 2", 
      content: (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Empty Card 2</div>
        </div>
      )
    },
    {
      title: "Card 3",
      content: (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Empty Card 3</div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={handlePrevCard}
          className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{currentCardIndex === 0 ? 'Back' : 'Previous'}</span>
        </button>
        
        <div className="flex-1" />
      </div>

      {/* Card Content */}
      {cards[currentCardIndex].content}

      {/* Touch handlers for swiping between cards */}
      <div
        className="absolute inset-0 z-30 touch-manipulation"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as any).startX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const startX = (e.currentTarget as any).startX;
          const deltaX = touch.clientX - startX;
          
          if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
              handlePrevCard();
            } else if (deltaX < 0 && currentCardIndex < cards.length - 1) {
              handleNextCard();
            }
          }
        }}
      />
    </div>
  );
};

export default RelatedArticlesCarousel;
