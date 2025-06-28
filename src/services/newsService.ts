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
}

class NewsService {
  private trustedSources = new Map([
    ['Guardian', 0.9],
    ['BBC News', 0.95],
    ['Reuters', 0.92],
    ['CNN', 0.8],
    ['NewsAPI', 0.7],
    ['Times of India', 0.95],
    ['Hindu', 0.92],
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
    ['Business Standard', 0.84]
  ]);

  // Categories to filter out for antiNews
  private excludedCategories = [
    'sports', 'sport', 'cricket', 'football', 'soccer', 'basketball', 'tennis',
    'music', 'entertainment', 'celebrity', 'bollywood', 'hollywood', 'movies',
    'fashion', 'lifestyle', 'gaming', 'games', 'film', 'actor', 'actress'
  ];

  // Store seen articles to prevent duplicates
  private seenArticles = new Set<string>();
  private titleCache = new Set<string>();

  async fetchAllNews(): Promise<NewsItem[]> {
    console.log('Fetching optimized news from multiple sources...');
    
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
          pageSize: 60 // Increased for more content
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.news && data.news.length > 0) {
          console.log(`Fetched ${data.news.length} articles from edge function`);
          const processedNews = this.processAndDeduplicateNews(data.news);
          
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
    
    // Fetch from multiple sources in parallel
    const sourcePromises = [
      this.fetchFromGuardian(),
      this.fetchFromNews18(),
      this.fetchFromIndianExpress(),
      this.fetchFromNDTV(),
      this.fetchFromTimesOfIndia()
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

    return this.processAndDeduplicateNews(allNews);
  }

  private processAndDeduplicateNews(articles: NewsItem[]): NewsItem[] {
    // Filter out unwanted content and template articles
    const filteredNews = articles.filter(article => {
      const content = `${article.headline} ${article.tldr} ${article.category}`.toLowerCase();
      
      // Skip template/system content
      if (article.author === 'antiNews System' || 
          article.category === 'System Update' ||
          article.headline.includes('Breaking: Real-time News Service')) {
        return false;
      }
      
      // Skip sports/entertainment
      if (this.excludedCategories.some(excluded => content.includes(excluded))) {
        return false;
      }
      
      return true;
    });

    console.log(`Filtered ${articles.length - filteredNews.length} unwanted articles`);

    // Advanced deduplication
    const deduplicatedNews = this.deduplicateArticles(filteredNews);
    
    // Prioritize Indian content
    const prioritizedNews = deduplicatedNews.sort((a, b) => {
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

    return prioritizedNews.slice(0, 50); // Increased limit for more content
  }

  private isTemplateContent(articles: NewsItem[]): boolean {
    return articles.every(article => 
      article.author === 'antiNews System' || 
      article.category === 'System Update' ||
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
      category: article.sectionName || 'News',
      imageUrl: article.fields?.thumbnail || this.getPlaceholderImage(index),
      readTime: '3 min read',
      publishedAt: article.webPublicationDate,
      sourceUrl: article.webUrl,
      trustScore: this.trustedSources.get('Guardian') || 0.8,
      localRelevance: this.calculateLocalRelevance(article.webTitle, article.fields?.trailText || ''),
      contextualInsights: this.generateContextualInsights(article.webTitle, article.fields?.trailText || '')
    }));
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

  private async fetchFromIndianExpress(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://indianexpress.com/print/front-page/feed/');
      const text = await response.text();
      return this.parseRSSFeed(text, 'Indian Express', 'indianexpress');
    } catch (error) {
      console.warn('Indian Express RSS failed:', error);
      return [];
    }
  }

  private async fetchFromNDTV(): Promise<NewsItem[]> {
    try {
      const response = await fetch('https://feeds.feedburner.com/ndtvnews-top-stories');
      const text = await response.text();
      return this.parseRSSFeed(text, 'NDTV', 'ndtv');
    } catch (error) {
      console.warn('NDTV RSS failed:', error);
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
        
        return {
          id: `${sourcePrefix}-${Date.now()}-${index}`,
          headline: title,
          tldr: this.cleanDescription(description) || this.generateTldr(title),
          quote: this.cleanDescription(description) || '',
          author: sourceName,
          category: this.categorizeNews(title, description),
          imageUrl: this.getPlaceholderImage(index + 50),
          readTime: '3 min read',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          sourceUrl: link,
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

  private categorizeNews(title: string, description: string): string {
    const content = `${title} ${description}`.toLowerCase();
    
    if (content.includes('economy') || content.includes('business') || content.includes('market')) return 'Economy';
    if (content.includes('health') || content.includes('medical') || content.includes('vaccine')) return 'Health';
    if (content.includes('climate') || content.includes('environment') || content.includes('energy')) return 'Environment';
    if (content.includes('technology') || content.includes('ai') || content.includes('digital')) return 'Technology';
    if (content.includes('education') || content.includes('school') || content.includes('university')) return 'Education';
    if (content.includes('government') || content.includes('policy') || content.includes('election')) return 'Politics';
    
    return 'World News';
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

    if (content.includes('economy') || content.includes('gdp') || content.includes('inflation')) {
      insights.push('Rising costs may affect household budgets and spending patterns in coming months');
      insights.push('Local businesses could see changes in consumer demand and pricing strategies');
    } else if (content.includes('election') || content.includes('vote') || content.includes('political')) {
      insights.push('Voting patterns may shift based on current policy outcomes and public sentiment');
      insights.push('New leadership could bring changes to local governance and public services');
    } else if (content.includes('technology') || content.includes('ai') || content.includes('digital')) {
      insights.push('Automation trends may create new job categories while eliminating others');
      insights.push('Digital skills training becomes increasingly important for career advancement');
    } else if (content.includes('climate') || content.includes('weather') || content.includes('environment')) {
      insights.push('Extreme weather patterns require updated emergency preparedness and infrastructure');
      insights.push('Green technology adoption could reduce long-term energy costs for households');
    } else if (content.includes('health') || content.includes('medical') || content.includes('vaccine')) {
      insights.push('Healthcare access and costs directly impact family financial planning');
      insights.push('Preventive measures now could reduce future medical expenses and complications');
    } else {
      insights.push('Global trends increasingly influence local markets and employment opportunities');
      insights.push('Economic shifts at the federal level typically affect regional job markets and business opportunities');
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
    return `https://images.unsplash.com/photo-${selectedId}?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }

  private getMinimalFallbackNews(): NewsItem[] {
    return [
      {
        id: 'fresh-1',
        headline: 'Breaking: Real-time News Service Temporarily Unavailable',
        tldr: 'Our news aggregation service is experiencing connectivity issues. We are working to restore full access to live news feeds.',
        quote: 'Technical teams are actively working to resolve connectivity issues with news sources.',
        author: 'antiNews System',
        category: 'System Update',
        imageUrl: this.getPlaceholderImage(1),
        readTime: '1 min read',
        publishedAt: new Date().toISOString(),
        sourceUrl: '',
        trustScore: 0.9,
        localRelevance: 0.9,
        contextualInsights: ['Service interruptions remind us of the importance of diverse news sources', 'Technical resilience is crucial for reliable information access']
      }
    ];
  }
}

export const newsService = new NewsService();
