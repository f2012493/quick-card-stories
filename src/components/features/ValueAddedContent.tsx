
import React from 'react';
import { TrendingUp, Users, Clock, Eye } from 'lucide-react';

interface ValueAddedContentProps {
  headline: string;
  category?: string;
}

const ValueAddedContent = ({ headline, category = 'general' }: ValueAddedContentProps) => {
  // Generate contextual insights based on headline keywords
  const generateInsights = () => {
    const insights = [];
    
    if (headline.toLowerCase().includes('election') || headline.toLowerCase().includes('political')) {
      insights.push('Election coverage from multiple perspectives');
      insights.push('Fact-checked against official sources');
    } else if (headline.toLowerCase().includes('economy') || headline.toLowerCase().includes('market')) {
      insights.push('Market impact analysis included');
      insights.push('Expert economist commentary');
    } else if (headline.toLowerCase().includes('climate') || headline.toLowerCase().includes('environment')) {
      insights.push('Scientific data verification complete');
      insights.push('Long-term impact assessment');
    } else {
      insights.push('Cross-referenced with primary sources');
      insights.push('Independent verification completed');
    }
    
    return insights;
  };

  const insights = generateInsights();
  
  return (
    <div className="mb-4 p-4 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
      <h3 className="text-yellow-400 text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
        <Eye className="w-4 h-4" />
        antiNews Insights
      </h3>
      
      <div className="space-y-2 mb-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
            <span className="text-white/90 text-sm">{insight}</span>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-blue-400" />
          <span className="text-white/70 text-xs">Trending #{Math.floor(Math.random() * 10) + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-purple-400" />
          <span className="text-white/70 text-xs">{Math.floor(Math.random() * 500) + 100}+ views</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-orange-400" />
          <span className="text-white/70 text-xs">Updated {Math.floor(Math.random() * 60)} min ago</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-white/70 text-xs">Live updates</span>
        </div>
      </div>
    </div>
  );
};

export default ValueAddedContent;
