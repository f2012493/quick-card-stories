
// Stub hook to replace deleted useTrustScoring
export const useTrustScoring = (articleId: string, userId?: string) => {
  return {
    existingVote: null,
    trustStats: null,
    voteTrust: {
      mutate: (params: any) => {
        // No-op for now - accepts params but does nothing
      }
    },
    isVoting: false
  };
};
