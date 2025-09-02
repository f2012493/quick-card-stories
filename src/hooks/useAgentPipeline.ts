import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentService } from '@/services/agentService';
import { PersonalizedContent, UserPreferences } from '@/types/agents';
import { toast } from 'sonner';

export const useAgentPipeline = () => {
  const queryClient = useQueryClient();

  const processArticle = useMutation({
    mutationFn: async ({ articleId, userId }: { articleId: string; userId?: string }) => {
      return agentService.processArticlePipeline(articleId, userId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['personalized-content'] });
      toast.success('Article processed successfully');
    },
    onError: (error) => {
      console.error('Failed to process article:', error);
      toast.error('Failed to process article');
    }
  });

  return {
    processArticle,
    isProcessing: processArticle.isPending
  };
};

export const usePersonalizedContent = (articleId: string, userId?: string) => {
  return useQuery({
    queryKey: ['personalized-content', articleId, userId],
    queryFn: () => userId ? agentService.getPersonalizedContent(articleId, userId) : null,
    enabled: !!articleId && !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useUserPreferences = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: preferences, ...query } = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: () => userId ? agentService.getUserPreferences(userId) : null,
    enabled: !!userId,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!userId) throw new Error('User ID required');
      return agentService.updateUserPreferences(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
      toast.success('Preferences updated');
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    }
  });

  return {
    preferences,
    updatePreferences,
    isUpdating: updatePreferences.isPending,
    ...query
  };
};