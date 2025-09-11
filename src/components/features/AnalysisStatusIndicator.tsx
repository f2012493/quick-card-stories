
import React from 'react';
import { Brain, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnalysisStatusIndicatorProps {
  storyNature?: string;
  storyBreakdown?: string;
  analysisConfidence?: number;
  className?: string;
}

const AnalysisStatusIndicator = ({ 
  storyNature, 
  storyBreakdown, 
  analysisConfidence,
  className = ""
}: AnalysisStatusIndicatorProps) => {
  const hasAnalysis = Boolean(storyBreakdown || storyNature);
  const confidence = analysisConfidence || 0;
  
  const getStatusInfo = () => {
    if (!hasAnalysis) {
      return {
        icon: Clock,
        color: 'bg-yellow-500/20 text-yellow-300',
        label: 'Analysis Pending',
        tooltip: 'Story analysis is being processed'
      };
    }
    
    if (confidence >= 0.8) {
      return {
        icon: CheckCircle,
        color: 'bg-green-500/20 text-green-300',
        label: 'Analyzed',
        tooltip: `High confidence analysis (${Math.round(confidence * 100)}%)`
      };
    }
    
    if (confidence >= 0.5) {
      return {
        icon: Brain,
        color: 'bg-blue-500/20 text-blue-300',
        label: 'Analyzed',
        tooltip: `Medium confidence analysis (${Math.round(confidence * 100)}%)`
      };
    }
    
    return {
      icon: AlertCircle,
      color: 'bg-orange-500/20 text-orange-300',
      label: 'Low Confidence',
      tooltip: `Low confidence analysis (${Math.round(confidence * 100)}%)`
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="outline" 
            className={`${statusInfo.color} border-current ${className}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{statusInfo.tooltip}</p>
            {storyNature && (
              <p className="text-xs text-muted-foreground">
                Type: {storyNature.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnalysisStatusIndicator;
