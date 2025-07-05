
export const calculateTrustScore = (sourceName: string): number => {
  const trustScores: { [key: string]: number } = {
    'Guardian': 0.9,
    'BBC': 0.95,
    'Reuters': 0.92,
    'CNN': 0.8,
    'Associated Press': 0.93,
    'NPR': 0.88,
    'Wall Street Journal': 0.87,
    'New York Times': 0.85
  };
  
  return trustScores[sourceName] || 0.7;
};

export const calculateLocalRelevance = (title: string, description: string, location?: string): number => {
  const content = `${title} ${description}`.toLowerCase();
  let relevanceScore = 0.5;

  const locationKeywords = ['local', 'city', 'state', 'community', 'region', 'municipal', 'county'];
  const impactKeywords = ['economy', 'jobs', 'school', 'transport', 'housing', 'health', 'safety'];
  
  if (locationKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.3;
  if (impactKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.2;
  
  if (location) {
    const locationParts = location.toLowerCase().split(',').map(part => part.trim());
    if (locationParts.some(part => content.includes(part))) relevanceScore += 0.4;
  }

  return Math.min(1, relevanceScore);
};
