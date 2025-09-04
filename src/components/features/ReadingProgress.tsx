
import React, { useEffect, useState } from 'react';

interface ReadingProgressProps {
  currentIndex: number;
  totalArticles: number;
}

const ReadingProgress = ({ currentIndex, totalArticles }: ReadingProgressProps) => {
  const [readingStreak, setReadingStreak] = useState(0);
  const [articlesReadToday, setArticlesReadToday] = useState(0);

  useEffect(() => {
    // Load reading stats from localStorage
    const today = new Date().toDateString();
    const stats = localStorage.getItem('reading-stats');
    
    if (stats) {
      const parsed = JSON.parse(stats);
      if (parsed.date === today) {
        setArticlesReadToday(parsed.count || 0);
        setReadingStreak(parsed.streak || 0);
      } else {
        // New day, reset daily count but check streak
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        if (parsed.date === yesterday && parsed.count > 0) {
          setReadingStreak((parsed.streak || 0) + 1);
        } else {
          setReadingStreak(0);
        }
        setArticlesReadToday(0);
      }
    }
  }, []);

  useEffect(() => {
    // Update reading stats when article changes
    const today = new Date().toDateString();
    const newCount = currentIndex + 1;
    
    const stats = {
      date: today,
      count: newCount,
      streak: readingStreak
    };
    
    localStorage.setItem('reading-stats', JSON.stringify(stats));
    setArticlesReadToday(newCount);
  }, [currentIndex, readingStreak]);

  return (
    <div className="fixed top-16 left-4 z-50 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs space-y-1">
      <div>📖 {currentIndex + 1} of {totalArticles}</div>
      <div>🔥 {readingStreak} day streak</div>
      <div>📈 {articlesReadToday} read today</div>
    </div>
  );
};

export default ReadingProgress;
