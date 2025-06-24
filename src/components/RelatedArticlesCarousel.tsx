
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

  // Get the first 3 related articles for the cards
  const cardsData = relatedArticles.slice(0, 3);

  const formatPublishedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

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

  const currentCard = cardsData[currentCardIndex];

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
          Card {currentCardIndex + 1} of {Math.min(cardsData.length, 3)}
        </div>
        
        <div className="w-20"></div> {/* Spacer to balance the layout */}
      </div>

      {/* Card Content */}
      {currentCard ? (
        <div className="flex-1 relative">
          {/* Article Image Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${currentCard.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7) contrast(1.1) saturate(1.2)'
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />
          
          {/* Content */}
          <div className="relative z-20 w-full h-full flex flex-col justify-end p-6">
            {/* Article Meta */}
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                {currentCard.category}
              </span>
              <span className="text-white/70 text-xs">{currentCard.readTime}</span>
              {currentCard.publishedAt && (
                <span className="text-white/70 text-xs">{formatPublishedDate(currentCard.publishedAt)}</span>
              )}
            </div>

            {/* Headline */}
            <h2 className="text-white text-xl md:text-2xl font-bold leading-tight mb-4 drop-shadow-2xl">
              {currentCard.headline}
            </h2>

            {/* TL;DR */}
            <div className="mb-6">
              <h3 className="text-blue-400 text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
                TL;DR
              </h3>
              <p className="text-white/95 text-sm leading-relaxed drop-shadow-lg">
                {currentCard.tldr}
              </p>
            </div>

            {/* Read Full Article Button */}
            <button
              onClick={() => onNavigateToArticle(currentCard.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start"
            >
              Read Full Article
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">No more related articles</div>
        </div>
      )}

      {/* Center-right Next Button */}
      {currentCardIndex < Math.min(cardsData.length - 1, 2) && (
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
