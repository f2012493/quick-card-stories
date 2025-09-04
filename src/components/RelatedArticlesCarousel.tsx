
import React from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Article {
  id: string;
  title: string;
  content?: string;
  description?: string;
  url: string;
  image_url?: string;
  author?: string;
  published_at: string;
}

interface RelatedArticlesCarouselProps {
  articles: Article[];
  onClose?: () => void;
}

const RelatedArticlesCarousel = ({ articles, onClose }: RelatedArticlesCarouselProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextArticle = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const prevArticle = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  if (!articles.length) return null;

  const currentArticle = articles[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-white">
        <CardContent className="p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>{currentIndex + 1} of {articles.length}</span>
                {currentArticle.author && <span>• {currentArticle.author}</span>}
                <span>• {new Date(currentArticle.published_at).toLocaleDateString()}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentArticle.title}
              </h2>
            </div>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="ml-4"
              >
                ×
              </Button>
            )}
          </div>

          {/* Image */}
          {currentArticle.image_url && (
            <div className="mb-4">
              <img 
                src={currentArticle.image_url} 
                alt={currentArticle.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-6">
            {currentArticle.content ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {currentArticle.content}
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {currentArticle.description}
              </p>
            )}
          </div>

          {/* External Link */}
          <div className="mb-6">
            <Button 
              variant="outline"
              onClick={() => window.open(currentArticle.url, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Read Original Article
            </Button>
          </div>

          {/* Navigation */}
          {articles.length > 1 && (
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={prevArticle}
                disabled={currentIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {articles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={nextArticle}
                disabled={currentIndex === articles.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatedArticlesCarousel;
