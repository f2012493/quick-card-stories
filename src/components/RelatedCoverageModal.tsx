
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

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

interface RelatedCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNews: NewsItem;
  allNews: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
}

const RelatedCoverageModal = ({ isOpen, onClose, currentNews, allNews, onNavigateToArticle }: RelatedCoverageModalProps) => {
  // Handle close button clicks with proper event stopping
  const handleCloseClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Close button clicked/touched');
    onClose();
  };

  // Handle dialog open change (for overlay clicks, escape key, etc.)
  const handleOpenChange = (open: boolean) => {
    console.log('Dialog open change:', open);
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-full max-h-full md:max-w-4xl md:max-h-[85vh] h-screen md:h-auto overflow-y-auto bg-white m-0 md:m-auto rounded-none md:rounded-lg [&>button]:hidden"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6 pt-4 md:pt-6">
          <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 leading-tight pr-4">
            Full Coverage: {currentNews.headline}
          </DialogTitle>
          <button
            onClick={handleCloseClick}
            onTouchEnd={handleCloseClick}
            className="h-10 w-10 md:h-8 md:w-8 p-0 flex-shrink-0 hover:bg-gray-100 rounded-full z-50 touch-manipulation bg-transparent border-none cursor-pointer flex items-center justify-center"
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            type="button"
          >
            <X className="h-5 w-5 md:h-4 md:w-4 text-gray-600" />
          </button>
        </DialogHeader>
        
        <div className="p-4 md:p-6">
          {/* Empty content area */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedCoverageModal;
