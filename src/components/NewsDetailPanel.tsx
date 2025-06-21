
import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
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
      generateAnalysis();
    }
  }, [isOpen, news.id]);

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      // Call analytics tracking
      onAnalyze(news.id);

      // Generate AI analysis based on available content
      const whatHappened = analyzeWhatHappened(news);
      const whyItMatters = analyzeWhyItMatters(news);
      const whoItAffects = analyzeWhoItAffects(news);

      setAnalysis({
        whatHappened,
        whyItMatters,
        whoItAffects
      });
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      toast.error('Failed to generate detailed analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeWhatHappened = (news: NewsItem): string => {
    const content = news.tldr || news.quote || news.headline;
    
    // Extract key facts from the content
    if (content.toLowerCase().includes('court') || content.toLowerCase().includes('ruling')) {
      return `A legal decision has been made regarding ${news.headline.toLowerCase()}. ${content.substring(0, 150)}...`;
    } else if (content.toLowerCase().includes('election') || content.toLowerCase().includes('vote')) {
      return `Electoral developments have occurred involving ${news.headline.toLowerCase()}. ${content.substring(0, 150)}...`;
    } else if (content.toLowerCase().includes('economic') || content.toLowerCase().includes('market')) {
      return `Economic or market-related developments have taken place. ${content.substring(0, 150)}...`;
    } else {
      return `${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`;
    }
  };

  const analyzeWhyItMatters = (news: NewsItem): string => {
    const category = news.category.toLowerCase();
    
    if (category.includes('tech')) {
      return 'This technological development could impact how we interact with digital services, potentially affecting millions of users and setting new industry standards.';
    } else if (category.includes('politic')) {
      return 'This political development could influence policy decisions, affect public opinion, and have implications for governance and democratic processes.';
    } else if (category.includes('business') || category.includes('econom')) {
      return 'This business or economic development could affect market conditions, employment opportunities, and financial planning for individuals and organizations.';
    } else if (category.includes('health')) {
      return 'This health-related news could impact public health policies, individual health decisions, and healthcare systems.';
    } else {
      return 'This development is significant as it may influence related sectors, affect stakeholder decisions, and contribute to ongoing societal conversations.';
    }
  };

  const analyzeWhoItAffects = (news: NewsItem): string => {
    const content = news.tldr || news.quote || news.headline;
    const category = news.category.toLowerCase();
    
    let primaryAffected = 'the general public';
    let secondaryAffected = 'related industries and stakeholders';

    if (category.includes('tech')) {
      primaryAffected = 'technology users and digital service consumers';
      secondaryAffected = 'tech companies, developers, and digital platforms';
    } else if (category.includes('politic')) {
      primaryAffected = 'citizens and voters';
      secondaryAffected = 'political parties, government institutions, and policy makers';
    } else if (category.includes('business')) {
      primaryAffected = 'investors, employees, and consumers';
      secondaryAffected = 'competing businesses, supply chains, and market regulators';
    } else if (category.includes('health')) {
      primaryAffected = 'patients and healthcare consumers';
      secondaryAffected = 'healthcare providers, medical researchers, and health insurers';
    }

    return `This primarily affects ${primaryAffected}, with secondary impacts on ${secondaryAffected}. The broader implications may extend to related communities and decision-makers in the field.`;
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
                <span className="ml-2 text-gray-600">Generating analysis...</span>
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
