
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrustVote {
  article_id: string;
  user_id: string;
  trust_vote: boolean;
}

export const useTrustScoring = (articleId: string, userId?: string) => {
  const queryClient = useQueryClient();

  // Get existing trust vote for this article by this user
  const { data: existingVote } = useQuery({
    queryKey: ['trust-vote', articleId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('trust_scores')
        .select('trust_vote')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId
  });

  // Get aggregate trust score for article
  const { data: trustStats } = useQuery({
    queryKey: ['trust-stats', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_scores')
        .select('trust_vote')
        .eq('article_id', articleId);
      
      if (error) throw error;
      
      const totalVotes = data.length;
      const trustVotes = data.filter(vote => vote.trust_vote).length;
      const trustRatio = totalVotes > 0 ? trustVotes / totalVotes : 0.5;
      
      return {
        totalVotes,
        trustVotes,
        trustRatio,
        trustPercentage: Math.round(trustRatio * 100)
      };
    }
  });

  // Submit trust vote
  const voteTrust = useMutation({
    mutationFn: async ({ trustVote }: { trustVote: boolean }) => {
      if (!userId) throw new Error('Must be logged in to vote');
      
      const { error } = await supabase
        .from('trust_scores')
        .upsert({
          article_id: articleId,
          user_id: userId,
          trust_vote: trustVote
        }, {
          onConflict: 'article_id,user_id'
        });
      
      if (error) throw error;
      
      // Update article trust score
      await supabase.rpc('calculate_trust_score', { article_uuid: articleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-vote', articleId, userId] });
      queryClient.invalidateQueries({ queryKey: ['trust-stats', articleId] });
      toast.success('Trust vote recorded');
    },
    onError: (error) => {
      console.error('Error voting trust:', error);
      toast.error('Failed to record trust vote');
    }
  });

  return {
    existingVote: existingVote?.trust_vote,
    trustStats,
    voteTrust,
    isVoting: voteTrust.isPending
  };
};
