
interface ContextualInfo {
  topic: string;
  backgroundInfo: string[];
  keyFacts: string[];
  relatedConcepts: string[];
}

class ContextService {
  private cache = new Map<string, ContextualInfo>();

  async fetchContextualInfo(headline: string, description: string, fullContent?: string): Promise<ContextualInfo> {
    const cacheKey = `${headline}-${description}`.substring(0, 100);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const contextualInfo: ContextualInfo = {
        topic: this.extractMainTopic(headline),
        backgroundInfo: this.extractRealBackgroundInfo(headline, description, fullContent),
        keyFacts: [],
        relatedConcepts: []
      };

      this.cache.set(cacheKey, contextualInfo);
      return contextualInfo;
    } catch (error) {
      console.error('Failed to fetch contextual info:', error);
      return {
        topic: 'General News',
        backgroundInfo: [],
        keyFacts: [],
        relatedConcepts: []
      };
    }
  }

  private extractRealBackgroundInfo(headline: string, description: string, fullContent?: string): string[] {
    const backgroundInfo: string[] = [];
    const combinedText = `${headline} ${description} ${fullContent || ''}`;
    
    // Extract specific factual information from the content
    const factualInfo = this.extractFactualInformation(combinedText);
    backgroundInfo.push(...factualInfo);

    // Extract historical context if present
    const historicalContext = this.extractHistoricalReferences(combinedText);
    if (historicalContext.length > 0) {
      backgroundInfo.push(...historicalContext);
    }

    // Extract procedural/process information
    const processInfo = this.extractProcessInformation(combinedText);
    if (processInfo.length > 0) {
      backgroundInfo.push(...processInfo);
    }

    // Extract regulatory/legal context
    const regulatoryInfo = this.extractRegulatoryInformation(combinedText);
    if (regulatoryInfo.length > 0) {
      backgroundInfo.push(...regulatoryInfo);
    }

    // Only return non-empty, specific background information
    return backgroundInfo.filter(info => info && info.length > 20).slice(0, 4);
  }

  private extractFactualInformation(text: string): string[] {
    const facts: string[] = [];
    const lowerText = text.toLowerCase();

    // Extract numerical facts and statistics
    const numberMatches = text.match(/(?:\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:crore|lakh|thousand|million|billion|percent|%|rs|rupees|dollars?|years?|months?|days?)/gi);
    if (numberMatches && numberMatches.length > 0) {
      const uniqueNumbers = [...new Set(numberMatches)];
      if (uniqueNumbers.length > 0) {
        facts.push(`Key figures mentioned: ${uniqueNumbers.slice(0, 3).join(', ')}`);
      }
    }

    // Extract specific dates and timeframes
    const dateMatches = text.match(/(?:since|from|in|during|after|before)\s+(?:\d{4}|\w+\s+\d{4}|last\s+\w+|past\s+\w+)/gi);
    if (dateMatches && dateMatches.length > 0) {
      const timeContext = dateMatches[0].replace(/^(since|from|in|during|after|before)\s+/i, '');
      facts.push(`Timeline context: This development relates to events ${timeContext}`);
    }

    // Extract organization/company information
    const orgMatches = text.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Ltd|Limited|Corp|Corporation|Inc|Company|Group|Bank|Authority|Commission|Ministry|Department))\b/g);
    if (orgMatches && orgMatches.length > 0) {
      const uniqueOrgs = [...new Set(orgMatches)];
      facts.push(`Organizations involved: ${uniqueOrgs.slice(0, 2).join(', ')}`);
    }

    return facts;
  }

  private extractHistoricalReferences(text: string): string[] {
    const historical: string[] = [];
    
    // Look for explicit historical references
    const historyPatterns = [
      /(?:this is the first time|for the first time|historically|unprecedented|never before|since independence|since \d{4})[^.!?]*[.!?]/gi,
      /(?:previously|earlier|in the past|until now|so far)[^.!?]*[.!?]/gi,
      /(?:compared to|unlike|different from)[^.!?]*(?:last year|previous|earlier|before)[^.!?]*[.!?]/gi
    ];

    historyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().replace(/\s+/g, ' ');
          if (cleaned.length > 30 && cleaned.length < 200) {
            historical.push(cleaned);
          }
        });
      }
    });

    return historical.slice(0, 2);
  }

  private extractProcessInformation(text: string): string[] {
    const processes: string[] = [];
    
    // Extract information about procedures, approvals, implementations
    const processPatterns = [
      /(?:the process involves?|procedure includes?|steps include|implementation requires?|approval process)[^.!?]*[.!?]/gi,
      /(?:according to|as per|under the|following the)[^.!?]*(?:guidelines?|rules?|regulations?|policy|act|law)[^.!?]*[.!?]/gi,
      /(?:will be|to be|being|was|were)\s+(?:implemented|introduced|launched|rolled out|established|set up)[^.!?]*[.!?]/gi
    ];

    processPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().replace(/\s+/g, ' ');
          if (cleaned.length > 30 && cleaned.length < 200) {
            processes.push(cleaned);
          }
        });
      }
    });

    return processes.slice(0, 2);
  }

  private extractRegulatoryInformation(text: string): string[] {
    const regulatory: string[] = [];
    
    // Extract regulatory, legal, or policy context
    const regulatoryPatterns = [
      /(?:under the|according to|as per|following)[^.!?]*(?:act|law|regulation|policy|rule|guideline|framework)[^.!?]*[.!?]/gi,
      /(?:court|tribunal|authority|commission|board)\s+(?:ruled|decided|ordered|directed|approved|rejected)[^.!?]*[.!?]/gi,
      /(?:legal|regulatory|compliance|statutory)[^.!?]*(?:requirement|framework|obligation|mandate)[^.!?]*[.!?]/gi
    ];

    regulatoryPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().replace(/\s+/g, ' ');
          if (cleaned.length > 30 && cleaned.length < 200) {
            regulatory.push(cleaned);
          }
        });
      }
    });

    return regulatory.slice(0, 2);
  }

  private extractMainTopic(headline: string): string {
    const words = headline.toLowerCase().split(' ');
    
    if (words.some(w => ['modi', 'bjp', 'congress', 'election', 'minister', 'government', 'parliament', 'policy'].includes(w))) {
      return 'Politics';
    }
    
    if (words.some(w => ['economy', 'gdp', 'rupee', 'inflation', 'market', 'business', 'trade', 'finance'].includes(w))) {
      return 'Economy';
    }
    
    if (words.some(w => ['technology', 'ai', 'digital', 'startup', 'tech', 'software', 'app'].includes(w))) {
      return 'Technology';
    }
    
    if (words.some(w => ['health', 'medical', 'hospital', 'vaccine', 'disease', 'covid', 'medicine'].includes(w))) {
      return 'Healthcare';
    }
    
    if (words.some(w => ['climate', 'environment', 'pollution', 'green', 'carbon', 'energy', 'renewable'].includes(w))) {
      return 'Environment';
    }

    if (words.some(w => ['sports', 'cricket', 'football', 'olympics', 'match', 'tournament', 'player'].includes(w))) {
      return 'Sports';
    }

    if (words.some(w => ['education', 'school', 'university', 'student', 'exam', 'learning'].includes(w))) {
      return 'Education';
    }
    
    return 'General News';
  }
}

export const contextService = new ContextService();
