import { NewsItem } from '../types/news';

interface PoliticalFilterResult {
  isPolitical: boolean;
  democraticValue: number;
  accuracyScore: number;
  contextScore: number;
  perspectiveBalance: number;
  flag: 'approved' | 'flagged' | 'rejected';
  flagReason?: string;
}

export class PoliticalNewsFilter {
  // Political keywords and indicators
  private politicalKeywords = [
    'election', 'vote', 'voting', 'poll', 'government', 'minister', 'parliament', 
    'congress', 'bjp', 'political', 'politics', 'candidate', 'campaign', 'policy',
    'legislation', 'bill', 'law', 'constitution', 'democracy', 'republic',
    'prime minister', 'president', 'governor', 'chief minister', 'mla', 'mp',
    'cabinet', 'opposition', 'coalition', 'party', 'rally', 'manifesto'
  ];

  // Misinformation indicators
  private misinformationPatterns = [
    /\b(fake|false|hoax|conspiracy|debunked)\b/i,
    /\b(unverified|unconfirmed|alleged)\b/i,
    /\b(rumor|rumour|speculation)\b/i,
    /\b(claims without evidence|baseless)\b/i
  ];

  // Democratic value keywords
  private democraticValueKeywords = [
    'voter', 'citizen', 'public interest', 'transparency', 'accountability',
    'governance', 'rights', 'freedom', 'justice', 'corruption', 'reform',
    'public service', 'welfare', 'development', 'infrastructure', 'education',
    'healthcare', 'economy', 'employment', 'budget', 'tax', 'subsidy'
  ];

  // Context indicators
  private contextIndicators = [
    'background', 'history', 'previously', 'context', 'consequence', 'impact',
    'result', 'effect', 'outcome', 'since', 'before', 'after', 'timeline',
    'analysis', 'expert', 'researcher', 'study', 'report', 'data', 'statistics'
  ];

  // Balance indicators (both positive and negative)
  private balanceIndicators = [
    'however', 'but', 'although', 'while', 'meanwhile', 'on the other hand',
    'critics say', 'supporters argue', 'opposition claims', 'government maintains',
    'both sides', 'multiple perspectives', 'various viewpoints'
  ];

  // Distortion patterns
  private distortionPatterns = [
    /\b(always|never|all|none|every|no one)\b/i, // Absolute statements
    /\b(outrageous|shocking|incredible|unbelievable)\b/i, // Sensational language
    /\b(slam|blast|destroy|demolish)\b/i, // Violent metaphors
    /\b(perfect|terrible|amazing|awful)\b/i // Extreme adjectives
  ];

  public filterPoliticalNews(article: NewsItem): NewsItem {
    const filterResult = this.analyzePoliticalContent(article);
    
    return {
      ...article,
      isPolitical: filterResult.isPolitical,
      democraticValue: filterResult.democraticValue,
      accuracyScore: filterResult.accuracyScore,
      contextScore: filterResult.contextScore,
      perspectiveBalance: filterResult.perspectiveBalance,
      politicalFlag: filterResult.flag,
      flagReason: filterResult.flagReason
    };
  }

  private analyzePoliticalContent(article: NewsItem): PoliticalFilterResult {
    const content = `${article.headline} ${article.tldr} ${article.quote}`.toLowerCase();
    
    // Check if content is political
    const isPolitical = this.isPoliticalContent(content);
    
    if (!isPolitical) {
      return {
        isPolitical: false,
        democraticValue: 0.5,
        accuracyScore: 0.5,
        contextScore: 0.5,
        perspectiveBalance: 0.5,
        flag: 'approved'
      };
    }

    // Analyze political content quality
    const democraticValue = this.assessDemocraticValue(content, article);
    const accuracyScore = this.assessAccuracy(content, article);
    const contextScore = this.assessContext(content, article);
    const perspectiveBalance = this.assessPerspectiveBalance(content);

    // Determine overall flag
    const { flag, flagReason } = this.determinePoliticalFlag(
      democraticValue, accuracyScore, contextScore, perspectiveBalance, content
    );

    return {
      isPolitical: true,
      democraticValue,
      accuracyScore,
      contextScore,
      perspectiveBalance,
      flag,
      flagReason
    };
  }

  private isPoliticalContent(content: string): boolean {
    const politicalMatches = this.politicalKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length;
    
    return politicalMatches >= 2; // Require at least 2 political keywords
  }

  private assessDemocraticValue(content: string, article: NewsItem): number {
    let score = 0.3; // Base score
    
    // Check for voter-relevant information
    const democraticMatches = this.democraticValueKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    ).length;
    
    score += Math.min(democraticMatches * 0.1, 0.4);
    
    // Boost for policy discussions
    if (content.includes('policy') || content.includes('reform')) {
      score += 0.2;
    }
    
    // Boost for public accountability content
    if (content.includes('transparency') || content.includes('accountability')) {
      score += 0.2;
    }
    
    // Penalty for pure gossip/personality content
    if (content.includes('personal') && !content.includes('policy')) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  private assessAccuracy(content: string, article: NewsItem): number {
    let score = 0.7; // Start with neutral-positive score
    
    // Check for misinformation patterns
    const misinformationDetected = this.misinformationPatterns.some(pattern =>
      pattern.test(content)
    );
    
    if (misinformationDetected) {
      score -= 0.4;
    }
    
    // Check for distortion patterns
    const distortionMatches = this.distortionPatterns.filter(pattern =>
      pattern.test(content)
    ).length;
    
    score -= distortionMatches * 0.1;
    
    // Boost for trusted sources
    if (article.trustScore && article.trustScore > 0.8) {
      score += 0.2;
    }
    
    // Check for fact-checking language
    if (content.includes('fact') || content.includes('verify') || content.includes('confirm')) {
      score += 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  private assessContext(content: string, article: NewsItem): number {
    let score = 0.2; // Low base score
    
    // Check for context indicators
    const contextMatches = this.contextIndicators.filter(indicator =>
      content.includes(indicator.toLowerCase())
    ).length;
    
    score += Math.min(contextMatches * 0.15, 0.6);
    
    // Boost for having contextual information
    if (article.contextualInfo && article.contextualInfo.backgroundInfo.length > 0) {
      score += 0.3;
    }
    
    // Check article length as proxy for depth
    if (content.length > 500) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private assessPerspectiveBalance(content: string): number {
    let score = 0.3; // Low base score
    
    // Check for balance indicators
    const balanceMatches = this.balanceIndicators.filter(indicator =>
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    score += Math.min(balanceMatches * 0.2, 0.5);
    
    // Check for multiple viewpoints
    if (content.includes('said') && content.includes('also said')) {
      score += 0.2;
    }
    
    // Boost for quotes from different sides
    const quoteCount = (content.match(/["']/g) || []).length;
    if (quoteCount >= 4) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private determinePoliticalFlag(
    democraticValue: number,
    accuracyScore: number,
    contextScore: number,
    perspectiveBalance: number,
    content: string
  ): { flag: 'approved' | 'flagged' | 'rejected'; flagReason?: string } {
    
    // Immediate rejection criteria
    if (accuracyScore < 0.3) {
      return { 
        flag: 'rejected', 
        flagReason: 'Potential misinformation or high distortion detected' 
      };
    }
    
    if (democraticValue < 0.2) {
      return { 
        flag: 'rejected', 
        flagReason: 'Low civic/democratic value - appears to be gossip or irrelevant content' 
      };
    }
    
    // Flagging criteria
    const averageScore = (democraticValue + accuracyScore + contextScore + perspectiveBalance) / 4;
    
    if (averageScore < 0.4) {
      return { 
        flag: 'flagged', 
        flagReason: 'Below quality threshold - lacks context or balanced perspective' 
      };
    }
    
    if (contextScore < 0.3 && perspectiveBalance < 0.3) {
      return { 
        flag: 'flagged', 
        flagReason: 'Insufficient context and perspective balance' 
      };
    }
    
    // Check for false balance (equal weight to fringe views)
    if (content.includes('both sides') && democraticValue < 0.5) {
      return { 
        flag: 'flagged', 
        flagReason: 'Potential false balance - giving equal weight to unequal positions' 
      };
    }
    
    return { flag: 'approved' };
  }

  public shouldIncludeArticle(article: NewsItem): boolean {
    return !article.politicalFlag || article.politicalFlag === 'approved';
  }

  public getFilteredArticles(articles: NewsItem[]): NewsItem[] {
    return articles
      .map(article => this.filterPoliticalNews(article))
      .filter(article => this.shouldIncludeArticle(article));
  }
}

export const politicalFilter = new PoliticalNewsFilter();