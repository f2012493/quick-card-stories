
import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  narrationText?: string;
}

interface NewsDetailPanelProps {
  news: NewsItem;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (newsId: string) => void;
}

interface NewsAnalysis {
  whatHappened: string;
  whyItMatters: string;
  whoItAffects: string;
}

const NewsDetailPanel = ({ news, isOpen, onClose, onAnalyze }: NewsDetailPanelProps) => {
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !analysis) {
      generateAIAnalysis();
    }
  }, [isOpen, news.id]);

  const generateAIAnalysis = async () => {
    setIsLoading(true);
    try {
      // Call analytics tracking
      onAnalyze(news.id);

      console.log('Generating AI analysis for:', news.headline);

      // Call our AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-news', {
        body: {
          headline: news.headline,
          tldr: news.tldr,
          content: news.quote || news.narrationText || '',
          category: news.category
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        throw new Error('Failed to generate AI analysis');
      }

      if (data) {
        setAnalysis({
          whatHappened: data.whatHappened,
          whyItMatters: data.whyItMatters,
          whoItAffects: data.whoItAffects
        });
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      toast.error('Failed to generate detailed analysis');
      
      // Fallback to basic analysis if AI fails
      setAnalysis({
        whatHappened: `${news.tldr || news.headline}`,
        whyItMatters: 'This development may have broader implications for the affected sectors and communities.',
        whoItAffects: 'Multiple stakeholders and related industries may be impacted by this development.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceClick = () => {
    if (news.sourceUrl) {
      window.open(news.sourceUrl, '_blank');
    } else {
      toast.info('Source link not available');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">News Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto pb-6">
          {/* News Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                news.category === 'Tech' ? 'bg-blue-100 text-blue-800' :
                news.category === 'Politics' ? 'bg-red-100 text-red-800' :
                news.category === 'Business' ? 'bg-green-100 text-green-800' :
                news.category === 'Health' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {news.category}
              </span>
              <span className="text-gray-500 text-xs">{news.readTime}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
              {news.headline}
            </h3>
            <p className="text-gray-600 text-sm">By {news.author}</p>
          </div>

          {/* Analysis Sections */}
          <div className="p-4 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Generating AI analysis...</span>
              </div>
            ) : analysis ? (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
                    What Happened
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{analysis.whatHappened}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
                    Why It Matters
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{analysis.whyItMatters}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
                    Who It Affects
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{analysis.whoItAffects}</p>
                </div>

                {/* Source Link */}
                {news.sourceUrl && (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSourceClick}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="font-medium">Read Full Article</span>
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPanel;
