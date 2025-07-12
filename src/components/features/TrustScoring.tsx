
import React from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Shield, AlertTriangle } from 'lucide-react';
import { useTrustScoring } from '@/hooks/useTrustScoring';

interface TrustScoringProps {
  articleId: string;
  userId?: string;
}

const TrustScoring = ({ articleId, userId }: TrustScoringProps) => {
  const { existingVote, trustStats, voteTrust, isVoting } = useTrustScoring(articleId, userId);

  const handleTrustVote = (trustVote: boolean) => {
    voteTrust.mutate({ trustVote });
  };

  const getTrustColor = (trustRatio: number) => {
    if (trustRatio >= 0.7) return 'text-green-400';
    if (trustRatio >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustIcon = (trustRatio: number) => {
    if (trustRatio >= 0.7) return <Shield className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (!trustStats) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${getTrustColor(trustStats.trustRatio)}`}>
          {getTrustIcon(trustStats.trustRatio)}
          <span className="text-sm font-medium">
            {trustStats.trustPercentage}% trusted
          </span>
        </div>
        <span className="text-white/60 text-xs">
          ({trustStats.totalVotes} votes)
        </span>
      </div>

      {userId && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTrustVote(true)}
            disabled={isVoting}
            className={`p-2 ${
              existingVote === true 
                ? 'bg-green-500/20 text-green-400' 
                : 'text-white/70 hover:text-green-400 hover:bg-green-500/10'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTrustVote(false)}
            disabled={isVoting}
            className={`p-2 ${
              existingVote === false 
                ? 'bg-red-500/20 text-red-400' 
                : 'text-white/70 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrustScoring;
