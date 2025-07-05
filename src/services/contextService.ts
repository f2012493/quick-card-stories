
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
      
      // Generate contextual information
      const contextualInfo: ContextualInfo = {
        topic,
        backgroundInfo: this.generateBackgroundInfo(headline, description, topic),
        keyFacts: this.generateKeyFacts(headline, description, topic),
        relatedConcepts: this.generateRelatedConcepts(topic)
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
    
    // Political topics
    if (words.some(w => ['modi', 'bjp', 'congress', 'election', 'minister', 'government'].includes(w))) {
      return 'Indian Politics';
    }
    
    // Economic topics
    if (words.some(w => ['economy', 'gdp', 'rupee', 'inflation', 'market', 'business'].includes(w))) {
      return 'Indian Economy';
    }
    
    // Technology topics
    if (words.some(w => ['technology', 'ai', 'digital', 'startup', 'tech'].includes(w))) {
      return 'Technology';
    }
    
    // Healthcare topics
    if (words.some(w => ['health', 'medical', 'hospital', 'vaccine', 'disease'].includes(w))) {
      return 'Healthcare';
    }
    
    // Environmental topics
    if (words.some(w => ['climate', 'environment', 'pollution', 'green', 'carbon'].includes(w))) {
      return 'Environment';
    }
    
    return 'General News';
  }

  private generateBackgroundInfo(headline: string, description: string, topic: string): string[] {
    const content = `${headline} ${description}`.toLowerCase();
    
    switch (topic) {
      case 'Indian Politics':
        return [
          'India operates as a federal parliamentary democratic republic with multiple political parties',
          'The Bharatiya Janata Party (BJP) and Indian National Congress are the two major national parties',
          'Elections are conducted by the Election Commission of India, an independent constitutional body',
          'Policy decisions at the central level affect implementation across 28 states and 8 union territories'
        ];
        
      case 'Indian Economy':
        return [
          'India is the world\'s fifth-largest economy by nominal GDP and third-largest by purchasing power parity',
          'The Reserve Bank of India (RBI) manages monetary policy and currency stability',
          'Major economic sectors include services (IT, financial), manufacturing, and agriculture',
          'Economic policies impact over 1.4 billion people across urban and rural areas'
        ];
        
      case 'Technology':
        return [
          'India is a global hub for information technology services and software development',
          'The country has over 700 million internet users, making it the second-largest online market',
          'Government initiatives like Digital India aim to transform the country into a digitally empowered society',
          'Bangalore, Hyderabad, and Pune are major technology centers in India'
        ];
        
      case 'Healthcare':
        return [
          'India has a mixed healthcare system with both public and private providers',
          'The Ayushman Bharat scheme provides health insurance coverage to over 500 million people',
          'India is known as the "pharmacy of the world" for producing affordable generic medicines',
          'Healthcare challenges include accessibility in rural areas and managing communicable diseases'
        ];
        
      case 'Environment':
        return [
          'India is the world\'s third-largest carbon emitter but has committed to net-zero emissions by 2070',
          'Air pollution is a major concern, especially in northern cities during winter months',
          'The country has significant renewable energy potential, particularly in solar and wind power',
          'Climate change impacts include irregular monsoons affecting agriculture and water resources'
        ];
        
      default:
        return [
          'India is a diverse nation with 22 official languages and multiple cultural regions',
          'As the world\'s largest democracy, developments here have global implications',
          'The country balances traditional values with rapid modernization and urbanization'
        ];
    }
  }

  private generateKeyFacts(headline: string, description: string, topic: string): string[] {
    switch (topic) {
      case 'Indian Politics':
        return [
          'Parliamentary system with 543 Lok Sabha and 245 Rajya Sabha seats',
          'Elections held every 5 years for Lok Sabha, staggered for state assemblies',
          'Coalition governments are common due to multi-party system'
        ];
        
      case 'Indian Economy':
        return [
          'GDP growth rate typically ranges between 6-8% annually',
          'Services sector contributes about 55% to GDP',
          'India is among the top 10 manufacturing countries globally'
        ];
        
      case 'Technology':
        return [
          'India has the world\'s largest IT services industry',
          'Over 4,750 technology startups as of 2023',
          'UPI (Unified Payments Interface) processes over 10 billion transactions monthly'
        ];
        
      case 'Healthcare':
        return [
          'Doctor-to-patient ratio is approximately 1:1,456',
          'Life expectancy has increased from 32 years in 1947 to 70+ years today',
          'India produces 60% of the world\'s vaccines'
        ];
        
      case 'Environment':
        return [
          'India has 5% of global renewable energy capacity',
          'Forest cover is about 21% of total geographical area',
          'The country experiences 6 distinct seasons due to monsoon patterns'
        ];
        
      default:
        return [
          'Population density: 464 people per square kilometer',
          '65% of population lives in rural areas',
          'Hindi and English are the most widely used languages for official purposes'
        ];
    }
  }

  private generateRelatedConcepts(topic: string): string[] {
    switch (topic) {
      case 'Indian Politics':
        return ['Democratic Institutions', 'Federalism', 'Electoral Reforms', 'Governance'];
        
      case 'Indian Economy':
        return ['Fiscal Policy', 'Trade Relations', 'Employment', 'Financial Markets'];
        
      case 'Technology':
        return ['Digital Transformation', 'Innovation', 'Cybersecurity', 'Data Privacy'];
        
      case 'Healthcare':
        return ['Public Health', 'Medical Research', 'Healthcare Access', 'Preventive Care'];
        
      case 'Environment':
        return ['Sustainability', 'Climate Action', 'Conservation', 'Green Technology'];
        
      default:
        return ['Social Development', 'Cultural Heritage', 'Economic Growth', 'Global Relations'];
    }
  }

  private getDefaultContext(headline: string): ContextualInfo {
    return {
      topic: 'General News',
      backgroundInfo: [
        'This news event is part of ongoing developments in India',
        'Understanding the broader context helps in making informed decisions',
        'Local and national implications should be considered together'
      ],
      keyFacts: [
        'India is home to 1.4+ billion people',
        'Decisions at national level impact millions of families',
        'Regional variations exist across different states'
      ],
      relatedConcepts: ['Current Affairs', 'Social Impact', 'Policy Implications']
    };
  }
}

export const contextService = new ContextService();
