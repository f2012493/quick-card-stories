
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Zap, Bot } from 'lucide-react';
import { useContentSummaries } from '@/hooks/useContentSummaries';

interface SummarySelectorProps {
  articleId: string;
  content: string;
  onSummaryChange: (summary: string, type: string) => void;
}

const SummarySelector = ({ articleId, content, onSummaryChange }: SummarySelectorProps) => {
  const [activeType, setActiveType] = useState<'original' | 'extractive' | 'abstractive'>('original');
  const { data: summaries } = useContentSummaries(articleId);

  const handleSummarySelect = (type: 'original' | 'extractive' | 'abstractive') => {
    setActiveType(type);
    
    let summaryText = content; // Default to original
    if (type === 'extractive' && summaries?.extractive_summary) {
      summaryText = summaries.extractive_summary;
    } else if (type === 'abstractive' && summaries?.abstractive_summary) {
      summaryText = summaries.abstractive_summary;
    }
    
    onSummaryChange(summaryText, type);
  };

  const getSummaryOptions = () => {
    const options = [
      { type: 'original' as const, label: 'Full', icon: FileText, available: true }
    ];
    
    if (summaries?.extractive_summary) {
      options.push({ type: 'extractive' as const, label: 'Key Points', icon: Zap, available: true });
    }
    
    if (summaries?.abstractive_summary) {
      options.push({ type: 'abstractive' as const, label: 'AI Summary', icon: Bot, available: true });
    }
    
    return options;
  };

  const options = getSummaryOptions();
  if (options.length <= 1) return null; // Don't show if no summaries available

  return (
    <div className="flex items-center gap-2 p-2 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 mb-4">
      <span className="text-white/70 text-sm font-medium">View:</span>
      {options.map(({ type, label, icon: Icon, available }) => (
        <Button
          key={type}
          size="sm"
          variant="ghost"
          onClick={() => handleSummarySelect(type)}
          disabled={!available}
          className={`flex items-center gap-1 text-xs ${
            activeType === type 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </Button>
      ))}
    </div>
  );
};

export default SummarySelector;
