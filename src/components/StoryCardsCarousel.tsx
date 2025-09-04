
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Users, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStoryAnalysis, StoryCard } from '@/hooks/useStoryAnalysis';

interface StoryCardsCarouselProps {
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
}

const StoryCardsCarousel = ({ articleId, isOpen, onClose, articleTitle }: StoryCardsCarouselProps) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { data: storyAnalysis, isLoading, error, isError } = useStoryAnalysis(articleId);

  if (!isOpen) return null;

  const nextCard = () => {
    if (storyAnalysis?.cards) {
      setCurrentCardIndex((prev) => (prev + 1) % storyAnalysis.cards.length);
    }
  };

  const prevCard = () => {
    if (storyAnalysis?.cards) {
      setCurrentCardIndex((prev) => (prev - 1 + storyAnalysis.cards.length) % storyAnalysis.cards.length);
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType) {
      case 'overview': return <AlertCircle className="w-5 h-5" />;
      case 'background': return <Clock className="w-5 h-5" />;
      case 'key_players': return <Users className="w-5 h-5" />;
      case 'impact_analysis': return <TrendingUp className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStoryNatureBadge = (nature: string) => {
    const natureConfig = {
      'policy_change': { label: 'Policy Change', color: 'bg-blue-500' },
      'scandal': { label: 'Scandal', color: 'bg-red-500' },
      'court_judgement': { label: 'Court Ruling', color: 'bg-purple-500' },
      'political_move': { label: 'Political Move', color: 'bg-orange-500' },
      'economic_development': { label: 'Economic News', color: 'bg-green-500' },
      'social_issue': { label: 'Social Issue', color: 'bg-pink-500' },
      'technology_advancement': { label: 'Tech News', color: 'bg-cyan-500' },
      'health_development': { label: 'Health News', color: 'bg-emerald-500' },
      'environmental_issue': { label: 'Environment', color: 'bg-lime-500' },
      'security_incident': { label: 'Security', color: 'bg-red-600' },
      'other': { label: 'General News', color: 'bg-gray-500' }
    };

    const config = natureConfig[nature as keyof typeof natureConfig] || natureConfig.other;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl max-h-[80vh] bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Analyzing Story...</h3>
                <p className="text-gray-600">
                  We're generating detailed story cards for this article. This may take a moment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !storyAnalysis || !storyAnalysis.cards || storyAnalysis.cards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl bg-white">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Story Analysis Processing</h3>
            <p className="text-gray-600 mb-4">
              {isError 
                ? "We encountered an issue while analyzing this story. Please try again later."
                : "Story analysis is being generated. Please check back in a few moments for detailed story cards."
              }
            </p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = storyAnalysis.cards[currentCardIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  {getStoryNatureBadge(storyAnalysis.story_nature)}
                  <span className="text-sm text-gray-500">
                    {Math.round(storyAnalysis.confidence_score * 100)}% confidence
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {articleTitle}
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Story metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{Math.ceil(storyAnalysis.estimated_read_time / 60)} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Complexity: {storyAnalysis.complexity_level}/5</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Sentiment: {storyAnalysis.sentiment_score > 0.6 ? 'Positive' : storyAnalysis.sentiment_score < 0.4 ? 'Negative' : 'Neutral'}</span>
              </div>
            </div>
          </div>

          {/* Card content */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {getCardIcon(currentCard.card_type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentCard.title}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {currentCard.card_type.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {currentCard.content}
              </div>
            </div>

            {/* Visual data if available */}
            {currentCard.visual_data && Object.keys(currentCard.visual_data).length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(currentCard.visual_data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {storyAnalysis.cards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCardIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentCardIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={nextCard}
                disabled={currentCardIndex === storyAnalysis.cards.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center mt-3 text-sm text-gray-500">
              Card {currentCardIndex + 1} of {storyAnalysis.cards.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryCardsCarousel;
