
import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';

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

interface BookmarkButtonProps {
  article: NewsItem;
}

const BookmarkButton = ({ article }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-articles') || '[]');
    setIsBookmarked(bookmarks.some((bookmark: NewsItem) => bookmark.id === article.id));
  }, [article.id]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-articles') || '[]');
    
    if (isBookmarked) {
      const filtered = bookmarks.filter((bookmark: NewsItem) => bookmark.id !== article.id);
      localStorage.setItem('bookmarked-articles', JSON.stringify(filtered));
      setIsBookmarked(false);
      toast.success('Removed from bookmarks');
    } else {
      bookmarks.push(article);
      localStorage.setItem('bookmarked-articles', JSON.stringify(bookmarks));
      setIsBookmarked(true);
      toast.success('Added to bookmarks');
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/20"
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="w-5 h-5 text-yellow-400" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
    </button>
  );
};

export default BookmarkButton;
