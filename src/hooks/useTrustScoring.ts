import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// This hook is no longer functional since trust_scores table was removed
// Keeping for backward compatibility but returns mock data
export const useTrustScoring = (articleId: string, userId?: string) => {
  const queryClient = useQueryClient();

  // Return mock data since trust_scores table no longer exists
  const { data: existingVote } = useQuery({
    queryKey: ['trust-vote', articleId, userId],
    queryFn: async () => {
      console.log('trust_scores table has been removed');
      return null;
    },
    enabled: false
  });

  const { data: trustStats } = useQuery({
    queryKey: ['trust-stats', articleId],
    queryFn: async () => {
      console.log('trust_scores table has been removed');
      return {
        totalVotes: 0,
        trustVotes: 0,
        trustRatio: 0.5,
        trustPercentage: 50
      };
    },
    enabled: false
  });

  const voteTrust = useMutation({
    mutationFn: async ({ trustVote }: { trustVote: boolean }) => {
      console.log('Trust voting functionality has been disabled');
      toast.info('Trust voting feature is currently disabled');
      return;
    },
    onSuccess: () => {
      // Do nothing since feature is disabled
    },
    onError: (error) => {
      console.error('Trust voting is disabled:', error);
      toast.error('Trust voting feature is currently disabled');
    }
  });

  return {
    existingVote: null,
    trustStats,
    voteTrust,
    isVoting: false
  };
};
