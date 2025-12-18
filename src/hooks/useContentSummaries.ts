
import { useQuery } from '@tanstack/react-query';

interface ContentSummary {
  id: string;
  article_id: string;
  extractive_summary: string | null;
  abstractive_summary: string | null;
  created_at: string;
}

export const useContentSummaries = (articleId: string) => {
  return useQuery({
    queryKey: ['content-summaries', articleId],
    queryFn: async (): Promise<ContentSummary | null> => {
      // Content summaries table doesn't exist yet - return null
      // This can be implemented when the table is created
      return null;
    },
    enabled: !!articleId
  });
};
