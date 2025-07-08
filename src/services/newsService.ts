import { contextService } from './contextService';

interface NewsSource {
  name: string;
  fetch: () => Promise<any[]>;
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
  trustScore?: number;
  localRelevance?: number;
  contextualInsights?: string[];
  contextualInfo?: {
    topic: string;
    backgroundInfo: string[];
    keyFacts: string[];
    relatedConcepts: string[];
  };
}

class NewsService {
  private trustedSources = new Map([
    ['Guardian', 0.9],
    ['BBC News', 0.95],
    ['BBC', 0.95],
    ['Reuters', 0.92],
    ['CNN', 0.8],
    ['NewsAPI', 0.7],
    ['Times of India', 0.95],
    ['The Hindu', 0.92],
    ['Indian Express', 0.88],
    ['NDTV', 0.85],
    ['Hindustan Times', 0.82],
    ['Economic Times', 0.88],
    ['News18', 0.8],
    ['India Today', 0.85],
    ['Deccan Herald', 0.8],
    ['FirstPost', 0.8],
    ['ThePrint', 0.85],
    ['Scroll.in', 0.88],
    ['LiveMint', 0.87],
    ['MoneyControl', 0.82],
    ['Business Standard', 0.84],
    ['Associated Press', 0.93],
    ['AP News', 0.93],
    ['NPR', 0.88],
    ['Wall Street Journal', 0.87],
    ['New York Times', 0.85],
    ['Washington Post', 0.83],
    ['Financial Times', 0.86],
    ['The Economist', 0.89]
  ]);

  // Categories to filter out for antiNews
  private excludedCategories = [
    'sports', 'sport', 'cricket', 'football', 'soccer', 'basketball', 'tennis',
    'music', 'entertainment', 'celebrity', 'bollywood', 'hollywood', 'movies',
    'fashion', 'lifestyle', 'gaming', 'games', 'film', 'actor', 'actress'
  ];

  // Garbage patterns to clean
  private garbagePatterns = [
    /n180c_[^-]*-?/gi,
    /_indian18oc_[^-]*-?/gi,
    /breaking-newsNews\d+/gi,
    /Mobile App - [^"]+/gi,
    /desc-youtube/gi,
    /onelink\.to\/[^\s]*/gi,
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /download.*app/gi,
    /app store/gi,
    /google play/gi
  ];

  // Store seen articles to prevent duplicates
  private seenArticles = new Set<string>();
  private titleCache = new Set<string>();

  private cleanGarbageText(text: string): string {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Apply garbage pattern cleaning
    this.garbagePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up artifacts
    cleaned = cleaned.replace(/[-_]{2,}/g, ' ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/^[-\s]+|[-\s]+$/g, '');
    
    return cleaned;
  }

  async fetchAllNews(): Promise<NewsItem[]> {
    console.log('Fetching diverse and cleaned news from multiple sources...');
    
    try {
      // Primary: Use Supabase edge function for better performance and CORS handling
      const response = await fetch('/functions/v1/fetch-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: 'India',
          category: 'general',
          pageSize: 100 // Increased for more diverse content
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.news && data.news.length > 0) {
          console.log(`Fetched ${data.news.length} articles from edge function`);
          const processedNews = await this.processAndDeduplicateNews(data.news);
          
          // Only return if we have real news, not template content
          if (processedNews.length > 0 && !this.isTemplateContent(processedNews)) {
            return processedNews;
          }
        }
      }
    } catch (error) {
      console.error('Edge function failed, trying direct sources:', error);
    }

    // Fallback: Multiple direct sources in parallel for better performance
    const allNews: NewsItem[] = [];
    
    // Fetch from multiple sources in parallel - expanded Indian sources
    const sourcePromises = [
      this.fetchFromGuardian(),
      this.fetchFromBBC(),
      this.fetchFromReuters(),
      this.fetchFromNews18(),
      this.fetchFromTimesOfIndia(),
      this.fetchFromNDTV(),
      this.fetchFromHindustanTimes(),
      this.fetchFromEconomicTimes(),
      this.fetchFromIndiaToday(),
      this.fetchFromDeccanHerald(),
      this.fetchFromTheHindu(),
      this.fetchFromIndianExpress(),
      this.fetchFromLiveMint(),
      this.fetchFromMoneyControl(),
      this.fetchFromBusinessStandard()
    ];

    const results = await Promise.allSettled(sourcePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allNews.push(...result.value);
        console.log(`Source ${index + 1} provided ${result.value.length} articles`);
      }
    });

    if (allNews.length === 0) {
      console.warn('All sources failed - returning empty array instead of template content');
      return [];
    }

    return await this.processAndDeduplicateNews(allNews);
  }

  private async processAndDeduplicateNews(articles: NewsItem[]): Promise<NewsItem[]> {
    // Clean all articles first
    const cleanedArticles = articles.map(article => ({
      ...article,
      headline: this.cleanGarbageText(article.headline),
      tldr: this.cleanGarbageText(article.tldr),
      quote: this.cleanGarbageText(article.quote)
    }));

    // Filter out unwanted content and template articles
    const filteredNews = cleanedArticles.filter(article => {
      const content = `${article.headline} ${article.tldr}`.toLowerCase();
      
      // Skip template/system content
      if (article.author === 'antiNews System' || 
          article.headline.includes('Breaking: Real-time News Service')) {
        return false;
      }
      
      // Skip if headline is too short after cleaning
      if (article.headline.length < 10) {
        return false;
      }
      
      // Skip sports/entertainment
      if (this.excludedCategories.some(excluded => content.includes(excluded))) {
        return false;
      }
      
      return true;
    });

    console.log(`Filtered ${articles.length - filteredNews.length} unwanted articles`);

    // Enhanced deduplication with contextual info
    const deduplicatedNews = this.deduplicateArticles(filteredNews);
    
    // Fetch contextual information for each article
    const newsWithContext = await Promise.all(
      deduplicatedNews.map(async (article) => {
        try {
          const contextualInfo = await contextService.fetchContextualInfo(
            article.headline,
            article.tldr
          );
          return {
            ...article,
            contextualInfo
          };
        } catch (error) {
          console.error('Failed to fetch context for article:', article.headline, error);
          return article;
        }
      })
    );
    
    // Prioritize diverse sources and quality content
    const prioritizedNews = newsWithContext.sort((a, b) => {
      // Prioritize diverse sources
      const aIsMainstream = ['Guardian', 'BBC', 'Reuters', 'CNN', 'Associated Press'].includes(a.author);
      const bIsMainstream = ['Guardian', 'BBC', 'Reuters', 'CNN', 'Associated Press'].includes(b.author);
      
      if (aIsMainstream && !bIsMainstream) return -1;
      if (!aIsMainstream && bIsMainstream) return 1;
      
      const aIsIndian = this.isIndianContent(a);
      const bIsIndian = this.isIndianContent(b);
      
      if (aIsIndian && !bIsIndian) return -1;
      if (!aIsIndian && bIsIndian) return 1;
      
      const aTrust = a.trustScore || 0.5;
      const bTrust = b.trustScore || 0.5;
      const aRelevance = a.localRelevance || 0.5;
      const bRelevance = b.localRelevance || 0.5;
      
      return (bTrust + bRelevance) - (aTrust + aRelevance);
    });

    return prioritizedNews.slice(0, 60); // Increased limit for more content
  }

  private isTemplateContent(articles: NewsItem[]): boolean {
    return articles.every(article => 
      article.author === 'antiNews System' || 
      article.headline.includes('Breaking: Real-time News Service')
    );
  }

  private deduplicateArticles(articles: NewsItem[]): NewsItem[] {
    const uniqueArticles: NewsItem[] = [];
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();

    for (const article of articles) {
      // Create a normalized title for comparison
      const normalizedTitle = article.headline.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Create a shorter version for similarity checking
      const titleWords = normalizedTitle.split(' ').slice(0, 8).join(' ');
      
      // Check for exact URL match
      if (article.sourceUrl && seenUrls.has(article.sourceUrl)) {
        console.log(`Skipping duplicate URL: ${article.headline}`);
        continue;
      }

      // Check for similar title
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        if (this.calculateSimilarity(titleWords, seenTitle) > 0.7) {
          console.log(`Skipping similar article: ${article.headline}`);
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueArticles.push(article);
        seenTitles.add(titleWords);
        if (article.sourceUrl) {
          seenUrls.add(article.sourceUrl);
        }
      }
    }

    console.log(`Deduplicated from ${articles.length} to ${uniqueArticles.length} articles`);
    return uniqueArticles;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private isIndianContent(article: NewsItem): boolean {
    const content = `${article.headline} ${article.tldr} ${article.author}`.toLowerCase();
    const indianKeywords = ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'modi', 'bjp', 'congress', 'rupee', 'maharashtra', 'gujarat', 'karnataka', 'tamil nadu', 'west bengal'];
    return indianKeywords.some(keyword => content.includes(keyword)) || 
           ['Times of India', 'Hindu', 'Indian Express', 'NDTV', 'Hindustan Times', 'Economic Times', 'News18', 'India Today'].includes(article.author);
  }

  private async fetchFromGuardian(): Promise<NewsItem[]> {
    try {
      const response = await fetch(
        'https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText,body&page-size=15'
      );
      
      if (!response.ok) throw new Error('Guardian API failed');
      
      const data = await response.json();
      
      return data.response.results.map((article: any, index: number): NewsItem => ({
        id: `guardian-${article.id}`,
        headline: article.webTitle,
        tldr: article.fields?.trailText || this.generateTldr(article.webTitle),
        quote: article.fields?.trailText || '',
        author: 'The Guardian',
        category: '',
        imageUrl: article.fields?.thumbnail || this.getRelevantImageUrl(article.webTitle, article.fields?.trailText || '', index),
        readTime: '3 min read',
        publishedAt: article.webPublicationDate,
        sourceUrl: article.webUrl,
        trustScore: this.trustedSources.get('Guardian') || 0.8,
        localRelevance: this.calculateLocalRelevance(article.webTitle, article.fields?.trailText || ''),
        contextualInsights: this.generateContextualInsights(article.webTitle, article.fields?.trailText || '')
      }));
    } catch (error) {
      console.warn('Guardian API failed:', error);
      return [];
    }
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

  private async fetchFromNews18(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.news18.com/rss/india.xml');
      const text = await response.text();
      return this.parseRSSFeed(text, 'News18', 'news18');
    } catch (error) {
      console.warn('News18 RSS failed:', error);
      return [];
    }
  }

  private async fetchFromTimesOfIndia(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://timesofindia.indiatimes.com/rssfeedstopstories.cms');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Times of India', 'toi');
    } catch (error) {
      console.warn('Times of India RSS failed:', error);
      return [];
    }
  }

  private async fetchFromNDTV(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.ndtv.com/rss/latest');
      const text = await response.text();
      return this.parseRSSFeed(text, 'NDTV', 'ndtv');
    } catch (error) {
      console.warn('NDTV RSS failed:', error);
      return [];
    }
  }

  private async fetchFromHindustanTimes(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Hindustan Times', 'ht');
    } catch (error) {
      console.warn('Hindustan Times RSS failed:', error);
      return [];
    }
  }

  private async fetchFromEconomicTimes(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://economictimes.indiatimes.com/rssfeedstopstories.cms');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Economic Times', 'et');
    } catch (error) {
      console.warn('Economic Times RSS failed:', error);
      return [];
    }
  }

  private async fetchFromIndiaToday(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.indiatoday.in/rss/1206578');
      const text = await response.text();
      return this.parseRSSFeed(text, 'India Today', 'indiatoday');
    } catch (error) {
      console.warn('India Today RSS failed:', error);
      return [];
    }
  }

  private async fetchFromDeccanHerald(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.deccanherald.com/rss/national.rss');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Deccan Herald', 'dh');
    } catch (error) {
      console.warn('Deccan Herald RSS failed:', error);
      return [];
    }
  }

  private async fetchFromTheHindu(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.thehindu.com/news/national/feeder/default.rss');
      const text = await response.text();
      return this.parseRSSFeed(text, 'The Hindu', 'thehindu');
    } catch (error) {
      console.warn('The Hindu RSS failed:', error);
      return [];
    }
  }

  private async fetchFromIndianExpress(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://indianexpress.com/section/india/feed/');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Indian Express', 'ie');
    } catch (error) {
      console.warn('Indian Express RSS failed:', error);
      return [];
    }
  }

  private async fetchFromLiveMint(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.livemint.com/rss/news');
      const text = await response.text();
      return this.parseRSSFeed(text, 'LiveMint', 'mint');
    } catch (error) {
      console.warn('LiveMint RSS failed:', error);
      return [];
    }
  }

  private async fetchFromMoneyControl(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.moneycontrol.com/rss/latestnews.xml');
      const text = await response.text();
      return this.parseRSSFeed(text, 'MoneyControl', 'mc');
    } catch (error) {
      console.warn('MoneyControl RSS failed:', error);
      return [];
    }
  }

  private async fetchFromBusinessStandard(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://www.business-standard.com/rss/latest.rss');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Business Standard', 'bs');
    } catch (error) {
      console.warn('Business Standard RSS failed:', error);
      return [];
    }
  }

  private parseRSSFeed(xmlText: string, sourceName: string, sourcePrefix: string): NewsItem[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const items = doc.querySelectorAll('item');
      
      return Array.from(items).slice(0, 15).map((item, index): NewsItem => {
        const title = item.querySelector('title')?.textContent || 'News Update';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        
        // Skip if it's sports/entertainment content
        const content = `${title} ${description}`.toLowerCase();
        if (this.excludedCategories.some(excluded => content.includes(excluded))) {
          return null;
        }

        // Try to extract image from media:content or enclosure
        let imageUrl = '';
        const mediaContent = item.querySelector('media\\:content, content');
        if (mediaContent) {
          imageUrl = mediaContent.getAttribute('url') || '';
        }
        
        // If no media image found, use relevant image based on content
        if (!imageUrl) {
          imageUrl = this.getRelevantImageUrl(title, description, index + 50);
        }
        
        return {
          id: `${sourcePrefix}-${Date.now()}-${index}`,
          headline: title,
          tldr: this.cleanDescription(description) || this.generateTldr(title),
          quote: this.cleanDescription(description) || '',
          author: sourceName,
          category: '',
          imageUrl: imageUrl,
          readTime: '3 min read',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          sourceUrl: link || '',
          trustScore: this.trustedSources.get(sourceName) || 0.8,
          localRelevance: this.calculateLocalRelevance(title, description),
          contextualInsights: this.generateContextualInsights(title, description)
        };
      }).filter(Boolean) as NewsItem[];
    } catch (error) {
      console.warn(`Failed to parse RSS from ${sourceName}:`, error);
      return [];
    }
  }

  private getRelevantImageUrl(headline: string, description: string = '', index: number): string {
    const content = `${headline} ${description}`.toLowerCase();
    
    // Get specific relevant images based on content analysis
    const imageKeywords = this.analyzeContentForImageKeywords(content);
    
    // Politics/Government - Use actual political/government imagery
    if (imageKeywords.includes('politics') || imageKeywords.includes('government')) {
      const politicsImages = [
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Parliament/government building
        'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Voting/democracy
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Government meeting
        'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Indian flag/politics
      ];
      return politicsImages[index % politicsImages.length];
    }
    
    // Business/Economy - Financial imagery
    if (imageKeywords.includes('business') || imageKeywords.includes('economy')) {
      const businessImages = [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Business meeting
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Stock market
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Finance charts
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Business growth
      ];
      return businessImages[index % businessImages.length];
    }
    
    // Technology - Tech imagery
    if (imageKeywords.includes('technology') || imageKeywords.includes('tech')) {
      const techImages = [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Technology background
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Woman with laptop
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Server room
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Digital innovation
      ];
      return techImages[index % techImages.length];
    }
    
    // Healthcare - Medical imagery
    if (imageKeywords.includes('health') || imageKeywords.includes('medical')) {
      const healthImages = [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Medical equipment
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Hospital corridor
        'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Healthcare worker
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Medical consultation
      ];
      return healthImages[index % healthImages.length];
    }
    
    // Environment/Climate
    if (imageKeywords.includes('environment') || imageKeywords.includes('climate')) {
      const envImages = [
        'https://images.unsplash.com/photo-1569163139394-de44cb33c2a0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Environmental scene
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Climate change
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Nature conservation
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Forest/environment
      ];
      return envImages[index % envImages.length];
    }
    
    // Indian cities/locations
    if (imageKeywords.includes('city') || imageKeywords.includes('urban')) {
      const cityImages = [
        'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Indian cityscape
        'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Mumbai skyline
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Indian street
        'https://images.unsplash.com/photo-1544281452-b33d11da4f72?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Delhi architecture
      ];
      return cityImages[index % cityImages.length];
    }
    
    // Violence/conflict - Use appropriate serious imagery
    if (imageKeywords.includes('violence') || imageKeywords.includes('conflict')) {
      const conflictImages = [
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Breaking news
        'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // News reporting
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Serious news
        'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Social issues
      ];
      return conflictImages[index % conflictImages.length];
    }
    
    // Default general news images
    const defaultImages = [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Newspaper
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Breaking news
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // News microphone
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // News matrix
      'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80', // Media screens
    ];
    
    return defaultImages[index % defaultImages.length];
  }

  private analyzeContentForImageKeywords(content: string): string[] {
    const keywords: string[] = [];
    
    // Political keywords
    if (content.includes('modi') || content.includes('bjp') || content.includes('congress') || 
        content.includes('election') || content.includes('government') || content.includes('minister') ||
        content.includes('parliament') || content.includes('policy') || content.includes('mns') ||
        content.includes('thackeray') || content.includes('political')) {
      keywords.push('politics', 'government');
    }
    
    // Business/Economy keywords
    if (content.includes('economy') || content.includes('market') || content.includes('business') || 
        content.includes('financial') || content.includes('rupee') || content.includes('gdp') ||
        content.includes('growth') || content.includes('stock') || content.includes('bank')) {
      keywords.push('business', 'economy');
    }
    
    // Technology keywords
    if (content.includes('technology') || content.includes('ai') || content.includes('digital') || 
        content.includes('startup') || content.includes('tech') || content.includes('software') ||
        content.includes('app') || content.includes('internet') || content.includes('cyber')) {
      keywords.push('technology', 'tech');
    }
    
    // Healthcare keywords
    if (content.includes('health') || content.includes('medical') || content.includes('hospital') || 
        content.includes('vaccine') || content.includes('doctor') || content.includes('patient') ||
        content.includes('disease') || content.includes('treatment')) {
      keywords.push('health', 'medical');
    }
    
    // Environmental keywords
    if (content.includes('climate') || content.includes('environment') || content.includes('pollution') || 
        content.includes('green') || content.includes('water') || content.includes('air') ||
        content.includes('forest') || content.includes('wildlife') || content.includes('carbon')) {
      keywords.push('environment', 'climate');
    }
    
    // Urban/City keywords
    if (content.includes('mumbai') || content.includes('delhi') || content.includes('bangalore') || 
        content.includes('chennai') || content.includes('city') || content.includes('urban') ||
        content.includes('metro') || content.includes('transport') || content.includes('infrastructure')) {
      keywords.push('city', 'urban');
    }
    
    // Violence/Conflict keywords
    if (content.includes('violence') || content.includes('attack') || content.includes('killed') || 
        content.includes('bomb') || content.includes('blast') || content.includes('accident') ||
        content.includes('death') || content.includes('injured') || content.includes('slap') ||
        content.includes('fight') || content.includes('conflict')) {
      keywords.push('violence', 'conflict');
    }
    
    return keywords;
  }

  private calculateLocalRelevance(title: string, description: string): number {
    const content = `${title} ${description}`.toLowerCase();
    let relevanceScore = 0.5;

    const locationKeywords = ['local', 'city', 'state', 'community', 'region', 'municipal', 'county'];
    const politicalKeywords = ['election', 'vote', 'policy', 'government', 'council', 'mayor'];
    const economicKeywords = ['economy', 'business', 'jobs', 'employment', 'market', 'trade'];
    const socialKeywords = ['education', 'health', 'housing', 'transport', 'infrastructure'];

    if (locationKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.3;
    if (politicalKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.2;
    if (economicKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.2;
    if (socialKeywords.some(keyword => content.includes(keyword))) relevanceScore += 0.2;

    return Math.min(1, relevanceScore);
  }

  private generateContextualInsights(title: string, description: string): string[] {
    const insights: string[] = [];
    const content = `${title} ${description}`.toLowerCase();

    // Economic and financial impact
    if (content.includes('rupee') || content.includes('inflation') || content.includes('interest rate')) {
      insights.push('Currency fluctuations directly affect fuel prices and daily expenses for Indian families');
      insights.push('Interest rate changes influence home loan EMIs and business credit costs across India');
    } else if (content.includes('gdp') || content.includes('growth') || content.includes('economy')) {
      insights.push('Economic growth determines job creation in metros like Mumbai, Delhi, and Bangalore');
      insights.push('GDP changes influence government spending on rural employment schemes like MGNREGA');
    }

    // Political and governance
    else if (content.includes('election') || content.includes('vote') || content.includes('bjp') || content.includes('congress')) {
      insights.push('Political changes affect implementation of schemes like PM-KISAN and Ayushman Bharat');
      insights.push('Election outcomes determine state budget allocations for education and healthcare');
    } else if (content.includes('policy') || content.includes('law') || content.includes('regulation')) {
      insights.push('New regulations create compliance costs for small businesses and affect pricing');
      insights.push('Policy changes often require 6-12 months for implementation across Indian states');
    }

    // Technology and innovation
    else if (content.includes('technology') || content.includes('ai') || content.includes('digital') || content.includes('startup')) {
      insights.push('Tech adoption accelerates in cities but creates digital divide with rural areas');
      insights.push('Digital transformation requires reskilling programs for India\'s large workforce');
    }

    // Infrastructure and urban development
    else if (content.includes('infrastructure') || content.includes('metro') || content.includes('highway') || content.includes('airport')) {
      insights.push('Infrastructure projects boost local employment but may cause traffic disruptions');
      insights.push('New transport links increase property values in connected suburban areas');
    }

    // Healthcare and public welfare
    else if (content.includes('health') || content.includes('hospital') || content.includes('vaccine') || content.includes('medical')) {
      insights.push('Healthcare policy changes affect insurance premiums and treatment costs for families');
      insights.push('Public health initiatives require community participation to achieve widespread benefits');
    }

    // Environmental and climate
    else if (content.includes('climate') || content.includes('environment') || content.includes('pollution') || content.includes('green')) {
      insights.push('Environmental regulations increase manufacturing costs but improve air quality in cities');
      insights.push('Climate patterns affect monsoon timing, influencing crop yields and food prices');
    }

    // Default insights for general news
    else {
      insights.push('National developments create opportunities in regional markets and employment');
      insights.push('Central government decisions typically influence state policies within 3-6 months');
    }

    return insights.slice(0, 3);
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
}

export const newsService = new NewsService();
