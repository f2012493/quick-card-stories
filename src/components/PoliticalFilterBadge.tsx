import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PoliticalFilterBadgeProps {
  isPolitical?: boolean;
  democraticValue?: number;
  accuracyScore?: number;
  contextScore?: number;
  perspectiveBalance?: number;
  politicalFlag?: 'approved' | 'flagged' | 'rejected';
  flagReason?: string;
}

const PoliticalFilterBadge = ({ 
  isPolitical, 
  democraticValue = 0, 
  accuracyScore = 0, 
  contextScore = 0, 
  perspectiveBalance = 0,
  politicalFlag,
  flagReason 
}: PoliticalFilterBadgeProps) => {
  if (!isPolitical) return null;

  const getBadgeVariant = () => {
    switch (politicalFlag) {
      case 'approved': return 'default';
      case 'flagged': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getBadgeIcon = () => {
    switch (politicalFlag) {
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'flagged': return <AlertTriangle className="w-3 h-3" />;
      case 'rejected': return <Shield className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const getBadgeText = () => {
    switch (politicalFlag) {
      case 'approved': return 'Verified Political';
      case 'flagged': return 'Review Needed';
      case 'rejected': return 'Filtered';
      default: return 'Political';
    }
  };

  const getTooltipContent = () => {
    const scores = [
      { label: 'Democratic Value', score: democraticValue },
      { label: 'Accuracy & Fairness', score: accuracyScore },
      { label: 'Context Provided', score: contextScore },
      { label: 'Perspective Balance', score: perspectiveBalance }
    ];

    return (
      <div className="space-y-2">
        <div className="font-medium">Political Content Filter Results</div>
        {flagReason && (
          <div className="text-sm text-muted-foreground">{flagReason}</div>
        )}
        <div className="space-y-1">
          {scores.map(({ label, score }) => (
            <div key={label} className="flex justify-between text-xs">
              <span>{label}:</span>
              <span className={`font-medium ${
                score >= 0.7 ? 'text-green-500' : 
                score >= 0.4 ? 'text-yellow-500' : 
                'text-red-500'
              }`}>
                {Math.round(score * 100)}%
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Content filtered for democratic value, accuracy, context, and balanced perspectives.
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getBadgeVariant()} className="flex items-center gap-1 text-xs">
            {getBadgeIcon()}
            {getBadgeText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PoliticalFilterBadge;