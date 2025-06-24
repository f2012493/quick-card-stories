
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
  const handleCloseClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-full h-full max-w-none max-h-none md:max-w-4xl md:max-h-[85vh] md:h-auto overflow-y-auto bg-white m-0 rounded-none md:rounded-lg [&>button]:hidden"
      >
        <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-base md:text-xl font-bold text-gray-900 leading-tight flex-1 pr-2">
              Full Coverage: {currentNews.headline}
            </DialogTitle>
            <button
              onClick={handleCloseClick}
              onTouchEnd={handleCloseClick}
              className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
              type="button"
              aria-label="Close"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="p-4 md:p-6">
          {/* Content area */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedCoverageModal;
