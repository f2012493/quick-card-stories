
// Stub hook to replace deleted useTrustScoring
export const useTrustScoring = (articleId: string, userId?: string) => {
  return {
    existingVote: null,
    trustStats: null,
    voteTrust: {
      mutate: () => {
        // No-op for now
      }
    },
    isVoting: false
  };
};
