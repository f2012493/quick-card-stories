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
      const entities = this.extractEntities(headline, description);
      const contextualInfo: ContextualInfo = {
        topic: this.extractMainTopic(headline),
        backgroundInfo: this.generateBackgroundFromEntities(entities, headline),
        keyFacts: this.generateFactsFromEntities(entities, headline, description),
        relatedConcepts: this.generateConceptsFromEntities(entities)
      };

      this.cache.set(cacheKey, contextualInfo);
      return contextualInfo;
    } catch (error) {
      console.error('Failed to fetch contextual info:', error);
      return this.getDefaultContext(headline);
    }
  }

  private extractEntities(headline: string, description: string): {
    people: string[],
    organizations: string[],
    locations: string[],
    numbers: string[],
    dates: string[],
    topics: string[]
  } {
    const text = `${headline} ${description}`.toLowerCase();
    
    // Extract people (common Indian names and titles)
    const people = this.extractPeople(text);
    
    // Extract organizations
    const organizations = this.extractOrganizations(text);
    
    // Extract locations
    const locations = this.extractLocations(text);
    
    // Extract numbers and percentages
    const numbers = this.extractNumbers(text);
    
    // Extract dates and time references
    const dates = this.extractDates(text);
    
    // Extract topic keywords
    const topics = this.extractTopicKeywords(text);

    return { people, organizations, locations, numbers, dates, topics };
  }

  private extractPeople(text: string): string[] {
    const people: string[] = [];
    const namePatterns = [
      /\b(modi|narendra modi|rahul gandhi|amit shah|mamata banerjee|arvind kejriwal|yogi adityanath|nitish kumar|sharad pawar|uddhav thackeray)\b/gi,
      /\b(minister|pm|chief minister|cm|president|ceo|chairman|director)\s+([a-z]+\s+[a-z]+)/gi,
      /\bdr\.?\s+([a-z]+\s+[a-z]+)/gi
    ];

    namePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        people.push(...matches.map(m => this.capitalizeWords(m)));
      }
    });

    return [...new Set(people)];
  }

  private extractOrganizations(text: string): string[] {
    const orgs: string[] = [];
    const orgPatterns = [
      /\b(bjp|congress|aap|tmc|sp|bsp|rjd|jdu|shiv sena|ncp|dmk|aiadmk)\b/gi,
      /\b(rbi|sebi|isro|drdo|ongc|ntpc|irctc|air india|tata|reliance|adani|infosys|tcs|wipro)\b/gi,
      /\b(supreme court|high court|parliament|lok sabha|rajya sabha|assembly)\b/gi,
      /\b([a-z]+\s+ltd|pvt ltd|corporation|authority|commission|board)\b/gi
    ];

    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        orgs.push(...matches.map(m => this.capitalizeWords(m)));
      }
    });

    return [...new Set(orgs)];
  }

  private extractLocations(text: string): string[] {
    const locations: string[] = [];
    const locationPatterns = [
      /\b(delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|surat|jaipur|lucknow|kanpur|nagpur|indore|bhopal|visakhapatnam|patna|vadodara|ghaziabad|ludhiana)\b/gi,
      /\b(uttar pradesh|maharashtra|bihar|west bengal|madhya pradesh|tamil nadu|rajasthan|karnataka|gujarat|andhra pradesh|odisha|telangana|kerala|jharkhand|assam|punjab|haryana|uttarakhand|himachal pradesh|tripura|meghalaya|manipur|nagaland|goa|arunachal pradesh|mizoram|sikkim)\b/gi,
      /\b(india|pakistan|china|usa|uk|russia|japan|australia|canada|germany|france)\b/gi
    ];

    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        locations.push(...matches.map(m => this.capitalizeWords(m)));
      }
    });

    return [...new Set(locations)];
  }

  private extractNumbers(text: string): string[] {
    const numbers: string[] = [];
    const numberPatterns = [
      /\b\d+(?:\.\d+)?\s*(?:crore|lakh|thousand|million|billion|percent|%|rs|rupees)\b/gi,
      /\b(?:rs\.?\s*)?\d+(?:,\d{3})*(?:\.\d+)?\b/gi
    ];

    numberPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        numbers.push(...matches);
      }
    });

    return [...new Set(numbers)].slice(0, 3);
  }

  private extractDates(text: string): string[] {
    const dates: string[] = [];
    const datePatterns = [
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/gi,
      /\b(?:today|yesterday|tomorrow|this week|next week|last week|this month|next month)\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    return [...new Set(dates)].slice(0, 2);
  }

  private extractTopicKeywords(text: string): string[] {
    const topics: string[] = [];
    const topicPatterns = [
      /\b(election|vote|campaign|policy|budget|tax|inflation|gdp|economy|market|stock|rupee)\b/gi,
      /\b(covid|vaccine|health|hospital|medicine|treatment|virus|pandemic)\b/gi,
      /\b(technology|ai|digital|startup|app|software|internet|mobile)\b/gi,
      /\b(climate|environment|pollution|renewable|solar|wind|carbon|green)\b/gi,
      /\b(education|school|university|exam|student|teacher|learning)\b/gi,
      /\b(sports|cricket|football|olympics|match|tournament|player|team)\b/gi
    ];

    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        topics.push(...matches.map(m => this.capitalizeWords(m)));
      }
    });

    return [...new Set(topics)];
  }

  private generateBackgroundFromEntities(entities: any, headline: string): string[] {
    const background: string[] = [];

    if (entities.organizations.length > 0) {
      background.push(`Key organizations involved: ${entities.organizations.slice(0, 3).join(', ')}`);
    }

    if (entities.people.length > 0) {
      background.push(`Notable figures mentioned: ${entities.people.slice(0, 3).join(', ')}`);
    }

    if (entities.locations.length > 0) {
      background.push(`Geographic scope includes: ${entities.locations.slice(0, 3).join(', ')}`);
    }

    if (entities.topics.length > 0) {
      const mainTopic = entities.topics[0];
      background.push(`This development relates to ${mainTopic.toLowerCase()} sector developments`);
    }

    return background.slice(0, 3);
  }

  private generateFactsFromEntities(entities: any, headline: string, description: string): string[] {
    const facts: string[] = [];

    if (entities.numbers.length > 0) {
      facts.push(`Financial/Statistical data: ${entities.numbers.slice(0, 2).join(', ')}`);
    }

    if (entities.dates.length > 0) {
      facts.push(`Timeline: ${entities.dates.slice(0, 2).join(', ')}`);
    }

    if (entities.organizations.length > 1) {
      facts.push(`Multiple stakeholders involved: ${entities.organizations.length} organizations mentioned`);
    }

    if (facts.length === 0) {
      facts.push('Multiple factors contributing to this development');
      facts.push('Implementation details are being finalized');
    }

    return facts.slice(0, 3);
  }

  private generateConceptsFromEntities(entities: any): string[] {
    const concepts: string[] = [];

    // Add concepts based on extracted entities
    if (entities.topics.length > 0) {
      concepts.push(...entities.topics.slice(0, 2));
    }

    if (entities.people.length > 0) {
      concepts.push('Political Leadership');
    }

    if (entities.organizations.length > 0) {
      concepts.push('Institutional Framework');
    }

    if (entities.locations.length > 0) {
      concepts.push('Regional Impact');
    }

    // Add default concepts if none extracted
    if (concepts.length === 0) {
      concepts.push('Policy Implementation', 'Stakeholder Engagement', 'Public Interest');
    }

    return [...new Set(concepts)].slice(0, 4);
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
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
