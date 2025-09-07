
export interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  quote: string;
  author: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
  trustScore?: number;
  localRelevance?: number;
  clusterId?: string;
  contextualInsights?: string[];
  fullContent?: string; // Add full article content
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
  // Political content filtering metadata
  isPolitical?: boolean;
  democraticValue?: number; // 0-1 score for voter information value
  accuracyScore?: number; // 0-1 score for clarity/accuracy/fairness
  contextScore?: number; // 0-1 score for historical context/consequences
  perspectiveBalance?: number; // 0-1 score for proportional representation
  politicalFlag?: 'approved' | 'flagged' | 'rejected';
  flagReason?: string;
}
