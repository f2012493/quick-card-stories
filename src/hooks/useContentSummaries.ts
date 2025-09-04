import { useQuery } from '@tanstack/react-query';

// This hook is no longer needed since content_summaries table was removed
// Keeping for backward compatibility but always returns null
export const useContentSummaries = (articleId: string) => {
  return useQuery({
    queryKey: ['content-summaries', articleId],
    queryFn: async () => {
      console.log('content_summaries table has been removed');
      return null;
    },
    enabled: false // Disable the query since table doesn't exist
  });
};
