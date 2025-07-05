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
        backgroundInfo: this.extractBackgroundFromContent(headline, description, fullContent),
        keyFacts: [],
        relatedConcepts: []
      };

      this.cache.set(cacheKey, contextualInfo);
      return contextualInfo;
    } catch (error) {
      console.error('Failed to fetch contextual info:', error);
      return this.getDefaultContext(headline);
    }
  }

  private extractBackgroundFromContent(headline: string, description: string, fullContent?: string): string[] {
    const text = `${headline} ${description} ${fullContent || ''}`.toLowerCase();
    const background: string[] = [];

    // Extract context based on article content analysis
    const contextPatterns = this.analyzeContentForContext(text, headline);
    
    // Extract historical context
    const historicalContext = this.extractHistoricalContext(text);
    if (historicalContext) {
      background.push(historicalContext);
    }

    // Extract procedural/process context
    const processContext = this.extractProcessContext(text, headline);
    if (processContext) {
      background.push(processContext);
    }

    // Extract impact/significance context
    const impactContext = this.extractImpactContext(text, headline);
    if (impactContext) {
      background.push(impactContext);
    }

    // Extract regulatory/legal context
    const regulatoryContext = this.extractRegulatoryContext(text);
    if (regulatoryContext) {
      background.push(regulatoryContext);
    }

    // If we don't have enough specific context, add some based on content analysis
    if (background.length < 2) {
      const additionalContext = this.generateAdditionalContext(text, headline);
      background.push(...additionalContext);
    }

    return background.slice(0, 4);
  }

  private analyzeContentForContext(text: string, headline: string): any {
    const entities = {
      organizations: this.extractOrganizations(text),
      people: this.extractPeople(text),
      locations: this.extractLocations(text),
      numbers: this.extractNumbers(text),
      topics: this.extractTopicKeywords(text)
    };

    return entities;
  }

  private extractHistoricalContext(text: string): string | null {
    // Look for historical references, previous events, or time-based context
    if (text.includes('first time') || text.includes('historic') || text.includes('unprecedented')) {
      return 'This represents a significant milestone or first-time occurrence in the sector';
    }
    
    if (text.includes('since') || text.includes('after') || text.includes('following')) {
      const timeReferences = text.match(/(?:since|after|following)\s+([^.]+)/gi);
      if (timeReferences && timeReferences[0]) {
        return `This development follows previous events: ${timeReferences[0].replace(/^(since|after|following)\s+/i, '')}`;
      }
    }

    if (text.includes('previously') || text.includes('earlier') || text.includes('before')) {
      return 'This builds upon previous developments and changes in the sector';
    }

    return null;
  }

  private extractProcessContext(text: string, headline: string): string | null {
    // Extract information about processes, procedures, or how things work
    if (text.includes('approval') || text.includes('cleared') || text.includes('authorized')) {
      return 'This involves regulatory approval processes and compliance requirements';
    }

    if (text.includes('implementation') || text.includes('rollout') || text.includes('launch')) {
      return 'This is part of a structured implementation or deployment process';
    }

    if (text.includes('investigation') || text.includes('probe') || text.includes('inquiry')) {
      return 'This involves investigative or review processes by relevant authorities';
    }

    if (text.includes('negotiation') || text.includes('discussion') || text.includes('talks')) {
      return 'This development involves ongoing negotiations or discussions between stakeholders';
    }

    return null;
  }

  private extractImpactContext(text: string, headline: string): string | null {
    // Extract information about impact, significance, or consequences
    if (text.includes('impact') || text.includes('affect') || text.includes('influence')) {
      const impactMatches = text.match(/(?:impact|affect|influence)\s+([^.]+)/gi);
      if (impactMatches && impactMatches[0]) {
        return `Impact analysis: ${impactMatches[0].substring(0, 100)}...`;
      }
    }

    if (text.includes('benefit') || text.includes('advantage') || text.includes('positive')) {
      return 'This development is expected to bring positive outcomes and benefits to stakeholders';
    }

    if (text.includes('challenge') || text.includes('concern') || text.includes('risk')) {
      return 'This situation presents certain challenges and considerations that need to be addressed';
    }

    if (text.includes('change') || text.includes('transform') || text.includes('shift')) {
      return 'This represents a significant change or transformation in the current landscape';
    }

    return null;
  }

  private extractRegulatoryContext(text: string): string | null {
    // Extract regulatory, legal, or policy context
    const regulatoryTerms = ['regulation', 'policy', 'law', 'rule', 'compliance', 'legal', 'court', 'judge', 'ruling'];
    
    for (const term of regulatoryTerms) {
      if (text.includes(term)) {
        if (term === 'court' || term === 'judge' || term === 'ruling') {
          return 'This involves legal proceedings and judicial decisions that may set precedents';
        } else {
          return 'This development operates within specific regulatory frameworks and policy guidelines';
        }
      }
    }

    return null;
  }

  private generateAdditionalContext(text: string, headline: string): string[] {
    const context: string[] = [];
    
    // Analyze the main subject/domain
    const domain = this.identifyDomain(text, headline);
    if (domain) {
      context.push(`This development is significant within the ${domain} sector and its operational framework`);
    }

    // Look for stakeholder involvement
    const stakeholders = this.identifyStakeholders(text);
    if (stakeholders.length > 0) {
      context.push(`Multiple stakeholders are involved including ${stakeholders.slice(0, 2).join(' and ')}, indicating broad sectoral impact`);
    }

    // Add timing/urgency context if available
    if (text.includes('urgent') || text.includes('immediate') || text.includes('emergency')) {
      context.push('This situation requires immediate attention and rapid response from relevant authorities');
    }

    return context;
  }

  private identifyDomain(text: string, headline: string): string | null {
    const domains = {
      'technology': ['tech', 'digital', 'ai', 'software', 'app', 'platform', 'innovation'],
      'healthcare': ['health', 'medical', 'hospital', 'patient', 'treatment', 'vaccine', 'disease'],
      'finance': ['bank', 'financial', 'economy', 'market', 'investment', 'fund', 'rupee', 'dollar'],
      'education': ['school', 'university', 'student', 'education', 'academic', 'learning'],
      'infrastructure': ['transport', 'road', 'railway', 'airport', 'construction', 'development'],
      'energy': ['power', 'electricity', 'energy', 'solar', 'renewable', 'fuel', 'coal'],
      'governance': ['government', 'ministry', 'policy', 'administration', 'public', 'citizen']
    };

    const combinedText = `${headline} ${text}`.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        return domain;
      }
    }

    return null;
  }

  private identifyStakeholders(text: string): string[] {
    const stakeholderPatterns = [
      /\b(ministry|department|commission|authority|board|council)\s+of\s+([a-z\s]+)/gi,
      /\b(government|administration|officials|ministers|authorities)/gi,
      /\b(companies|corporations|firms|businesses|industry)/gi,
      /\b(citizens|public|people|residents|community)/gi,
      /\b(experts|analysts|researchers|specialists)/gi
    ];

    const stakeholders: string[] = [];
    
    stakeholderPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        stakeholders.push(...matches.slice(0, 2));
      }
    });

    return [...new Set(stakeholders)];
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
        'This news event is part of ongoing developments in the sector',
        'Multiple factors and stakeholders contribute to this situation',
        'Understanding the broader context helps in making informed decisions'
      ],
      keyFacts: [],
      relatedConcepts: []
    };
  }
}

export const contextService = new ContextService();
