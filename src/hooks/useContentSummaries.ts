
// Stub hook to replace deleted useContentSummaries
export const useContentSummaries = (articleId: string) => {
  return {
    data: null // Return null since content summaries are removed
  };
};
