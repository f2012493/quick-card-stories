
interface ContextualInfo {
  topic: string;
  backgroundInfo: string[];
  keyFacts: string[];
  relatedConcepts: string[];
}

class ContextService {
  private cache = new Map<string, ContextualInfo>();

  async fetchContextualInfo(headline: string, description: string): Promise<ContextualInfo> {
    const cacheKey = `${headline}-${description}`.substring(0, 100);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Extract main topic from headline
      const topic = this.extractMainTopic(headline);
      
      // Generate contextual information based on keywords and content analysis
      const contextualInfo: ContextualInfo = {
        topic,
        backgroundInfo: this.extractBackgroundInfo(headline, description),
        keyFacts: this.extractKeyFacts(headline, description),
        relatedConcepts: this.extractRelatedConcepts(headline, description)
      };

      this.cache.set(cacheKey, contextualInfo);
      return contextualInfo;
    } catch (error) {
      console.error('Failed to fetch contextual info:', error);
      return this.getDefaultContext(headline);
    }
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

  private extractBackgroundInfo(headline: string, description: string): string[] {
    const content = `${headline} ${description}`.toLowerCase();
    const backgroundInfo: string[] = [];

    // Extract factual context based on content analysis
    if (content.includes('inflation') || content.includes('price')) {
      backgroundInfo.push('Inflation affects purchasing power and cost of living for consumers');
    }

    if (content.includes('election') || content.includes('vote')) {
      backgroundInfo.push('Elections determine representation and policy direction');
    }

    if (content.includes('technology') || content.includes('digital')) {
      backgroundInfo.push('Digital transformation is reshaping industries and daily life');
    }

    if (content.includes('climate') || content.includes('environment')) {
      backgroundInfo.push('Environmental policies balance economic growth with sustainability');
    }

    if (content.includes('health') || content.includes('medical')) {
      backgroundInfo.push('Healthcare access and quality impact public health outcomes');
    }

    // Add general context if no specific matches
    if (backgroundInfo.length === 0) {
      backgroundInfo.push('This development may have broader implications for stakeholders');
      backgroundInfo.push('Context and timing are important factors to consider');
    }

    return backgroundInfo.slice(0, 3); // Limit to 3 items
  }

  private extractKeyFacts(headline: string, description: string): string[] {
    const content = `${headline} ${description}`.toLowerCase();
    const keyFacts: string[] = [];

    // Extract numerical data and concrete facts
    const numbers = content.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      keyFacts.push(`Key figures mentioned: ${numbers.join(', ')}`);
    }

    // Location-based facts
    const locations = this.extractLocations(content);
    if (locations.length > 0) {
      keyFacts.push(`Locations involved: ${locations.join(', ')}`);
    }

    // Time-based facts
    if (content.includes('year') || content.includes('month') || content.includes('day')) {
      keyFacts.push('Timeline and scheduling are key considerations');
    }

    // Add default facts if none extracted
    if (keyFacts.length === 0) {
      keyFacts.push('Multiple stakeholders may be affected');
      keyFacts.push('Implementation details are important');
    }

    return keyFacts.slice(0, 3); // Limit to 3 items
  }

  private extractRelatedConcepts(headline: string, description: string): string[] {
    const content = `${headline} ${description}`.toLowerCase();
    const concepts: string[] = [];

    // Economic concepts
    if (content.includes('economy') || content.includes('market') || content.includes('business')) {
      concepts.push('Economic Impact', 'Market Dynamics');
    }

    // Political concepts
    if (content.includes('government') || content.includes('policy') || content.includes('minister')) {
      concepts.push('Governance', 'Policy Implementation');
    }

    // Social concepts
    if (content.includes('society') || content.includes('public') || content.includes('community')) {
      concepts.push('Social Impact', 'Public Interest');
    }

    // Technology concepts
    if (content.includes('technology') || content.includes('digital') || content.includes('innovation')) {
      concepts.push('Innovation', 'Digital Transformation');
    }

    // Default concepts if none matched
    if (concepts.length === 0) {
      concepts.push('Current Affairs', 'Public Policy', 'Social Development');
    }

    return concepts.slice(0, 4); // Limit to 4 items
  }

  private extractLocations(content: string): string[] {
    const locations: string[] = [];
    const commonPlaces = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'india', 'gujarat', 'maharashtra', 'karnataka', 'tamil nadu'];
    
    commonPlaces.forEach(place => {
      if (content.includes(place)) {
        locations.push(place.charAt(0).toUpperCase() + place.slice(1));
      }
    });

    return [...new Set(locations)]; // Remove duplicates
  }

  private getDefaultContext(headline: string): ContextualInfo {
    return {
      topic: 'General News',
      backgroundInfo: [
        'This news event is part of ongoing developments',
        'Multiple factors contribute to this situation',
        'Understanding context helps in making informed decisions'
      ],
      keyFacts: [
        'Stakeholder interests vary across different groups',
        'Implementation timeline affects outcomes',
        'Regional variations may apply'
      ],
      relatedConcepts: ['Current Affairs', 'Policy Impact', 'Social Development']
    };
  }
}

export const contextService = new ContextService();
