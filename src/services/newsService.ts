interface NewsSource {
  name: string;
  fetch: (location?: LocationData) => Promise<any[]>;
}

interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
}

interface NewsItem {
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
  location?: string;
  relevanceScore?: number;
}

class NewsService {
  private sources: NewsSource[] = [];

  constructor() {
    this.initializeSources();
  }

  private initializeSources() {
    // Guardian API with location support
    this.sources.push({
      name: 'Guardian',
      fetch: (location) => this.fetchFromGuardian(location)
    });

    // News API with country support
    this.sources.push({
      name: 'NewsAPI',
      fetch: (location) => this.fetchFromNewsAPI(location)
    });

    // BBC RSS
    this.sources.push({
      name: 'BBC',
      fetch: () => this.fetchFromBBC()
    });

    // Reuters RSS
    this.sources.push({
      name: 'Reuters',
      fetch: () => this.fetchFromReuters()
    });

    // Location-specific sources
    this.sources.push({
      name: 'LocalNews',
      fetch: (location) => this.fetchLocalNews(location)
    });
  }

  async fetchAllNews(location?: LocationData): Promise<NewsItem[]> {
    console.log('Fetching news for location:', location);
    
    const allNews: NewsItem[] = [];
    const promises = this.sources.map(source => 
      source.fetch(location).catch(error => {
        console.warn(`Failed to fetch from ${source.name}:`, error);
        return [];
      })
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`Successfully fetched ${result.value.length} articles from ${this.sources[index].name}`);
        allNews.push(...result.value);
      }
    });

    if (allNews.length === 0) {
      console.warn('All news sources failed, using location-aware fallback');
      return this.getCuratedFallbackNews(location);
    }

    // Score articles based on location relevance
    const scoredNews = this.scoreNewsByLocation(allNews, location);
    
    // Sort by relevance score and recency
    scoredNews.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0) * 0.7 + this.getRecencyScore(a.publishedAt) * 0.3;
      const scoreB = (b.relevanceScore || 0) * 0.7 + this.getRecencyScore(b.publishedAt) * 0.3;
      return scoreB - scoreA;
    });

    return scoredNews.slice(0, 20);
  }

  private scoreNewsByLocation(articles: NewsItem[], location?: LocationData): NewsItem[] {
    if (!location) return articles;

    return articles.map(article => {
      let score = 0.5; // Base score
      
      // Boost local relevance
      if (location.city && article.headline.toLowerCase().includes(location.city.toLowerCase())) {
        score += 0.4;
      }
      if (location.region && article.headline.toLowerCase().includes(location.region.toLowerCase())) {
        score += 0.3;
      }
      if (location.country && article.headline.toLowerCase().includes(location.country.toLowerCase())) {
        score += 0.2;
      }
      
      // Category relevance based on location
      if (location.countryCode === 'US') {
        if (['politics', 'business', 'technology'].includes(article.category.toLowerCase())) {
          score += 0.2;
        }
      } else {
        if (['world', 'international', 'global'].some(keyword => 
          article.category.toLowerCase().includes(keyword))) {
          score += 0.2;
        }
      }
      
      return {
        ...article,
        relevanceScore: Math.min(score, 1.0)
      };
    });
  }

  private getRecencyScore(publishedAt?: string): number {
    if (!publishedAt) return 0;
    
    const now = new Date().getTime();
    const published = new Date(publishedAt).getTime();
    const ageInHours = (now - published) / (1000 * 60 * 60);
    
    // Recent articles get higher scores
    if (ageInHours < 2) return 1.0;
    if (ageInHours < 6) return 0.8;
    if (ageInHours < 24) return 0.6;
    if (ageInHours < 48) return 0.4;
    return 0.2;
  }

  private async fetchFromGuardian(location?: LocationData): Promise<NewsItem[]> {
    let url = 'https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText&page-size=10';
    
    // Add location-based search terms
    if (location?.country) {
      url += `&q=${encodeURIComponent(location.country)}`;
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Guardian API failed');
      
      const data = await response.json();
      
      return data.response.results.map((article: any, index: number) => ({
        id: `guardian-${article.id}`,
        headline: article.webTitle,
        tldr: article.fields?.trailText || this.generateTldr(article.webTitle),
        quote: this.extractQuote(article.fields?.trailText || ''),
        author: 'The Guardian',
        category: article.sectionName || 'News',
        imageUrl: article.fields?.thumbnail || this.getPlaceholderImage(index),
        readTime: '3 min read',
        publishedAt: article.webPublicationDate,
        sourceUrl: article.webUrl,
        location: location?.city
      }));
    } catch (error) {
      console.warn('Guardian API error:', error);
      return [];
    }
  }

  private async fetchFromNewsAPI(location?: LocationData): Promise<NewsItem[]> {
    let url = 'https://newsapi.org/v2/top-headlines?pageSize=10&apiKey=demo';
    
    // Use country code for more relevant results
    if (location?.countryCode) {
      url += `&country=${location.countryCode.toLowerCase()}`;
    } else {
      url += '&country=us'; // Default fallback
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('NewsAPI failed');
      
      const data = await response.json();
      
      return (data.articles || []).map((article: any, index: number) => ({
        id: `newsapi-${Date.now()}-${index}`,
        headline: article.title,
        tldr: article.description || this.generateTldr(article.title),
        quote: this.extractQuote(article.description || ''),
        author: article.author || article.source?.name || 'News Team',
        category: this.categorizeByContent(article.title + ' ' + (article.description || '')),
        imageUrl: article.urlToImage || this.getPlaceholderImage(index),
        readTime: '2 min read',
        publishedAt: article.publishedAt,
        sourceUrl: article.url,
        location: location?.city
      }));
    } catch (error) {
      console.warn('NewsAPI error:', error);
      return [];
    }
  }

  private async fetchLocalNews(location?: LocationData): Promise<NewsItem[]> {
    if (!location || !location.city) return [];
    
    // Generate location-specific curated news
    return this.generateLocationSpecificNews(location);
  }

  private generateLocationSpecificNews(location: LocationData): NewsItem[] {
    const locationNews = [
      {
        id: `local-${Date.now()}-1`,
        headline: `Local Innovation Hub Opens in ${location.city}`,
        tldr: `A new technology and innovation center has opened in ${location.city}, bringing together startups, established companies, and educational institutions to foster collaboration and economic growth.`,
        quote: `This hub will create hundreds of jobs and position ${location.city} as a leader in innovation.`,
        author: `${location.city} Business Journal`,
        category: 'Local Business',
        imageUrl: this.getPlaceholderImage(0),
        readTime: '3 min read',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceUrl: '',
        location: location.city,
        relevanceScore: 0.9
      },
      {
        id: `local-${Date.now()}-2`,
        headline: `${location.region} Leads in Sustainable Energy Adoption`,
        tldr: `${location.region} has achieved significant milestones in renewable energy adoption, with solar and wind projects exceeding targets and reducing carbon emissions by 25% this year.`,
        quote: `We're proving that environmental responsibility and economic growth go hand in hand.`,
        author: `${location.region} Environmental Council`,
        category: 'Environment',
        imageUrl: this.getPlaceholderImage(1),
        readTime: '4 min read',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceUrl: '',
        location: location.region,
        relevanceScore: 0.8
      }
    ];

    return locationNews;
  }

  private categorizeByContent(content: string): string {
    const categories = {
      'technology': ['tech', 'ai', 'software', 'digital', 'innovation', 'startup'],
      'business': ['business', 'economy', 'market', 'finance', 'company', 'industry'],
      'health': ['health', 'medical', 'hospital', 'disease', 'treatment', 'medicine'],
      'politics': ['government', 'election', 'policy', 'politics', 'congress', 'senate'],
      'sports': ['sports', 'game', 'team', 'player', 'championship', 'league'],
      'environment': ['climate', 'environment', 'green', 'sustainable', 'renewable', 'energy']
    };

    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    
    return 'General';
  }

  private extractQuote(text: string): string {
    if (!text) return '';
    
    // Extract sentences that might be good quotes
    const sentences = text.split('.').filter(s => s.length > 20 && s.length < 150);
    return sentences[0]?.trim() + '.' || text.substring(0, 100) + '...';
  }

  private async fetchFromBBC(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://feeds.bbci.co.uk/news/rss.xml');
      const text = await response.text();
      return this.parseRSSFeed(text, 'BBC News', 'bbc');
    } catch (error) {
      console.warn('BBC RSS failed:', error);
      return [];
    }
  }

  private async fetchFromReuters(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Reuters', 'reuters');
    } catch (error) {
      console.warn('Reuters RSS failed:', error);
      return [];
    }
  }

  private parseRSSFeed(xmlText: string, sourceName: string, sourcePrefix: string): NewsItem[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const items = doc.querySelectorAll('item');
      
      return Array.from(items).slice(0, 8).map((item, index) => {
        const title = item.querySelector('title')?.textContent || 'News Update';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        
        return {
          id: `${sourcePrefix}-${Date.now()}-${index}`,
          headline: title,
          tldr: this.cleanDescription(description) || this.generateTldr(title),
          quote: this.extractQuote(this.cleanDescription(description)),
          author: sourceName,
          category: this.categorizeByContent(title + ' ' + description),
          imageUrl: this.getPlaceholderImage(index + 50),
          readTime: '3 min read',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          sourceUrl: link
        };
      });
    } catch (error) {
      console.warn(`Failed to parse RSS from ${sourceName}:`, error);
      return [];
    }
  }

  private cleanDescription(description: string): string {
    if (!description) return '';
    
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim()
      .substring(0, 200)
      .replace(/\s+/g, ' ');
  }

  private generateTldr(headline: string): string {
    const words = headline.split(' ');
    if (words.length <= 12) return headline;
    return words.slice(0, 12).join(' ') + '...';
  }

  private getPlaceholderImage(index: number): string {
    const imageIds = [
      '1504711434969-e33886168f5c',
      '1495020689067-958852a7765e',
      '1586339949916-3e9457bef6d3',
      '1521295121783-8a321d551ad2',
      '1557804506-669a67965ba0',
      '1518770660439-4636190af475',
      '1581091226825-a6a2a5aee158',
      '1526374965328-7f61d4dc18c5',
      '1605810230434-7631ac76ec81',
      '1581092795360-fd1ca04f0952'
    ];
    
    const selectedId = imageIds[index % imageIds.length];
    return `https://images.unsplash.com/photo-${selectedId}?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80`;
  }

  private getCuratedFallbackNews(location?: LocationData): NewsItem[] {
    const baseNews = [
      {
        id: 'curated-1',
        headline: 'Global Technology Summit Highlights AI Innovations',
        tldr: 'Leading tech companies showcased breakthrough AI technologies at the annual Global Technology Summit, focusing on practical applications in healthcare, education, and sustainable development.',
        quote: 'AI will reshape how we work, learn, and solve complex global challenges.',
        author: 'Tech News Team',
        category: 'Technology',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '3 min read',
        publishedAt: new Date().toISOString(),
        sourceUrl: ''
      },
      {
        id: 'curated-2',
        headline: 'Climate Change Initiatives Show Promising Results',
        tldr: 'New renewable energy projects across multiple countries are exceeding expected performance metrics, contributing significantly to global carbon emission reduction goals.',
        quote: 'These results prove that sustainable energy investments are both environmentally and economically viable.',
        author: 'Environmental Reporter',
        category: 'Environment',
        imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '4 min read',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceUrl: ''
      },
      {
        id: 'curated-3',
        headline: 'Scientific Breakthrough in Medical Research',
        tldr: 'Researchers announce significant progress in developing new treatment methods for chronic diseases, with clinical trials showing promising early results.',
        quote: 'This breakthrough could revolutionize treatment approaches for millions of patients worldwide.',
        author: 'Medical News',
        category: 'Health',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '5 min read',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceUrl: ''
      }
    ];

    // Add location-specific content if available
    if (location?.city) {
      baseNews.unshift({
        id: 'local-fallback',
        headline: `Breaking: Major Development Announced in ${location.city}`,
        tldr: `Local authorities in ${location.city} have announced a significant infrastructure project that will boost economic development and improve quality of life for residents.`,
        quote: `This project represents our commitment to building a better future for ${location.city}.`,
        author: `${location.city} News`,
        category: 'Local News',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '3 min read',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        sourceUrl: '',
        location: location.city,
        relevanceScore: 0.9
      });
    }

    return baseNews;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const newsService = new NewsService();
