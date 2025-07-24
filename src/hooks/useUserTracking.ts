
// Stub hook to replace deleted useUserTracking
export const useUserTracking = () => {
  return {
    trackInteraction: {
      mutate: (params: any) => {
        // No-op for now - accepts params but does nothing
      }
    }
  };
};
