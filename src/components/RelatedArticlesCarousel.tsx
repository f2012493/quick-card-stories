
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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleNextCard = () => {
    console.log('handleNextCard called, currentCardIndex:', currentCardIndex);
    if (currentCardIndex < 2) {
      const newIndex = currentCardIndex + 1;
      setCurrentCardIndex(newIndex);
      console.log('Moving to next card:', newIndex);
    }
  };

  const handlePrevCard = () => {
    console.log('handlePrevCard called, currentCardIndex:', currentCardIndex);
    if (currentCardIndex > 0) {
      const newIndex = currentCardIndex - 1;
      setCurrentCardIndex(newIndex);
      console.log('Moving to previous card:', newIndex);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    console.log('Touch start on carousel, x:', touch.clientX, 'y:', touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    console.log('Touch end on carousel, deltaX:', deltaX, 'deltaY:', deltaY);
    console.log('Current card index:', currentCardIndex);
    
    // Reset touch start
    setTouchStart(null);
    
    // Check if it's more of a vertical swipe (scroll down = next story)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 80) {
      if (deltaY > 0) {
        console.log('Vertical swipe down detected - going to next story');
        onSwipeLeft();
        return;
      }
    }
    
    // Handle horizontal swipes for card navigation
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        console.log('Swipe right detected - going to PREVIOUS card');
        handlePrevCard(); // Swipe right = go to previous card
      } else {
        console.log('Swipe left detected - going to NEXT card');
        handleNextCard(); // Swipe left = go to next card
      }
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 relative z-50">
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
        
        <div className="w-20"></div> {/* Spacer to balance the layout */}
      </div>

      {/* Card Content */}
      {cards[currentCardIndex].content}

      {/* Center-right Next Button */}
      {currentCardIndex < 2 && (
        <button
          onClick={handleNextCard}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm z-50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Touch handlers for swiping between cards - highest z-index */}
      <div
        className="absolute inset-0 z-[60] touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default RelatedArticlesCarousel;
