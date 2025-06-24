
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
    console.log('handleNextCard called, currentCardIndex:', currentCardIndex);
    if (currentCardIndex < 2) {
      setCurrentCardIndex(currentCardIndex + 1);
      console.log('Moving to card:', currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    console.log('handlePrevCard called, currentCardIndex:', currentCardIndex);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      console.log('Moving to card:', currentCardIndex - 1);
    } else {
      console.log('Going back to main story');
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
        
        <div className="text-white text-sm">
          Card {currentCardIndex + 1} of 3
        </div>
      </div>

      {/* Card Content */}
      {cards[currentCardIndex].content}

      {/* Touch handlers for swiping between cards */}
      <div
        className="absolute inset-0 z-40 touch-manipulation"
        onTouchStart={(e) => {
          e.stopPropagation();
          const touch = e.touches[0];
          (e.currentTarget as any).startX = touch.clientX;
          (e.currentTarget as any).startY = touch.clientY;
          console.log('Touch start on carousel, startX:', touch.clientX, 'startY:', touch.clientY);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          const touch = e.changedTouches[0];
          const startX = (e.currentTarget as any).startX || 0;
          const startY = (e.currentTarget as any).startY || 0;
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;
          
          console.log('Touch end on carousel, deltaX:', deltaX, 'deltaY:', deltaY);
          
          // Check if it's more of a vertical swipe (scroll down = next story)
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
              console.log('Vertical swipe down detected - going to next story');
              onSwipeLeft();
              return;
            }
          }
          
          // Handle horizontal swipes for card navigation
          if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
              console.log('Swipe right detected');
              handlePrevCard();
            } else if (deltaX < 0) {
              console.log('Swipe left detected');
              handleNextCard();
            }
          }
        }}
      />
    </div>
  );
};

export default RelatedArticlesCarousel;
