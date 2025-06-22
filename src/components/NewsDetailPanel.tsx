
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Clock, Globe } from 'lucide-react';
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
}

interface NewsDetailPanelProps {
  news: NewsItem;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (newsId: string) => void;
}

interface RelatedNewsItem {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  perspective?: string;
}

const NewsDetailPanel = ({ news, isOpen, onClose, onAnalyze }: NewsDetailPanelProps) => {
  const [relatedNews, setRelatedNews] = useState<RelatedNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coverageStats, setCoverageStats] = useState<{ sources: number; entities: string[] }>({ sources: 0, entities: [] });

  useEffect(() => {
    if (isOpen && relatedNews.length === 0) {
      fetchFullCoverage();
    }
  }, [isOpen, news.id]);

  const fetchFullCoverage = async () => {
    setIsLoading(true);
    try {
      // Call analytics tracking
      onAnalyze(news.id);

      console.log('Fetching full coverage for:', news.headline);

      // Call our full coverage edge function
      const { data, error } = await supabase.functions.invoke('get-related-news', {
        body: {
          headline: news.headline,
          category: news.category
        }
      });

      if (error) {
        console.error('Full coverage error:', error);
        throw new Error('Failed to fetch full coverage');
      }

      if (data && data.relatedNews) {
        setRelatedNews(data.relatedNews);
        setCoverageStats({
          sources: data.sources || 0,
          entities: data.entities || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch full coverage:', error);
      toast.error('Failed to load full coverage');
      
      // Fallback to mock data
      setRelatedNews([
        {
          headline: 'Related perspective from different outlet',
          source: 'News Source 1',
          url: '#',
          publishedAt: new Date().toISOString(),
          summary: 'Additional perspective and analysis from another news source...',
          perspective: 'analysis'
        },
        {
          headline: 'Breaking update on the same story',
          source: 'News Source 2', 
          url: '#',
          publishedAt: new Date().toISOString(),
          summary: 'Latest developments and updates on this ongoing story...',
          perspective: 'breaking'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    } else {
      toast.info('Source link not available');
    }
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getPerspectiveIcon = (perspective?: string) => {
    switch (perspective) {
      case 'breaking': return '🚨';
      case 'analysis': return '📊';
      case 'investigation': return '🔍';
      case 'reaction': return '💬';
      case 'background': return '📚';
      default: return '📰';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Full Coverage</h2>
            {coverageStats.sources > 0 && (
              <p className="text-sm text-gray-500">{coverageStats.sources} sources • Multiple perspectives</p>
            )}
          </div>
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

          {/* Full Coverage Section */}
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-blue-500" />
              <h4 className="text-lg font-semibold text-gray-900">
                Full Coverage from Multiple Sources
              </h4>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading full coverage...</span>
              </div>
            ) : relatedNews.length > 0 ? (
              <div className="space-y-4">
                {relatedNews.map((article, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleSourceClick(article.url)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-2 flex-1">
                        <span className="text-lg">{getPerspectiveIcon(article.perspective)}</span>
                        <h5 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                          {article.headline}
                        </h5>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2 ml-6">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 ml-6">
                      <span className="font-medium">{article.source}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatPublishedDate(article.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No additional coverage found</p>
              </div>
            )}

            {/* Original Source Link */}
            {news.sourceUrl && (
              <div className="pt-6 border-t border-gray-100 mt-6">
                <button
                  onClick={() => handleSourceClick(news.sourceUrl!)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium">Read Original Article</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPanel;
