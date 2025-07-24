
// Stub hook to replace deleted useUserTracking
export const useUserTracking = () => {
  return {
    trackInteraction: {
      mutate: () => {
        // No-op for now
      }
    }
  };
};
