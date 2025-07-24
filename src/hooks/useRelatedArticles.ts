
// Stub hook to replace deleted useRelatedArticles
export const useRelatedArticles = (clusterId?: string) => {
  return {
    data: [] // Return empty array since clustering is removed
  };
};
