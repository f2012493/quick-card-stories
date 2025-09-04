
import React, { useEffect, useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  category: string;
}

interface PersonalizedRecommendationsProps {
  currentArticle: NewsItem;
  allArticles: NewsItem[];
  onNavigateToArticle: (articleId: string) => void;
}

const PersonalizedRecommendations = ({ 
  currentArticle, 
  allArticles, 
  onNavigateToArticle 
}: PersonalizedRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<NewsItem[]>([]);
  const [userInterests, setUserInterests] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load user interests from localStorage
    const interests = JSON.parse(localStorage.getItem('user-interests') || '{}');
    setUserInterests(interests);
  }, []);

  useEffect(() => {
    // Track current article view
    const interests = { ...userInterests };
    interests[currentArticle.category] = (interests[currentArticle.category] || 0) + 1;
    setUserInterests(interests);
    localStorage.setItem('user-interests', JSON.stringify(interests));

    // Generate recommendations based on interests
    const categoryScores = Object.entries(interests).sort(([,a], [,b]) => b - a);
    const topCategories = categoryScores.slice(0, 3).map(([category]) => category);
    
    const recommended = allArticles
      .filter(article => 
        article.id !== currentArticle.id && 
        topCategories.includes(article.category)
      )
      .slice(0, 3);
    
    setRecommendations(recommended);
  }, [currentArticle, allArticles, userInterests]);

  if (recommendations.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-black/40 backdrop-blur-sm rounded-lg p-3 max-w-64">
      <div className="flex items-center space-x-2 text-white text-sm mb-2">
        <Star className="w-4 h-4 text-yellow-400" />
        <span>For You</span>
      </div>
      <div className="space-y-2">
        {recommendations.map((article) => (
          <button
            key={article.id}
            onClick={() => onNavigateToArticle(article.id)}
            className="text-left text-white/80 text-xs hover:text-white hover:bg-white/10 p-2 rounded transition-colors w-full"
          >
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span className="line-clamp-2">{article.headline}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
