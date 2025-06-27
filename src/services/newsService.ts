
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
}

class NewsService {
  private sources: NewsSource[] = [];

  constructor() {
    this.initializeSources();
  }

  private initializeSources() {
    // Guardian API (free tier)
    this.sources.push({
      name: 'Guardian',
      fetch: () => this.fetchFromGuardian()
    });

    // News API (free tier)
    this.sources.push({
      name: 'NewsAPI',
      fetch: () => this.fetchFromNewsAPI()
    });

    // BBC RSS (free)
    this.sources.push({
      name: 'BBC',
      fetch: () => this.fetchFromBBC()
    });

    // Reuters RSS (free)
    this.sources.push({
      name: 'Reuters',
      fetch: () => this.fetchFromReuters()
    });

    // CNN RSS (free)
    this.sources.push({
      name: 'CNN',
      fetch: () => this.fetchFromCNN()
    });

    // Hacker News API (free)
    this.sources.push({
      name: 'HackerNews',
      fetch: () => this.fetchFromHackerNews()
    });
  }

  async fetchAllNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    const promises = this.sources.map(source => 
      source.fetch().catch(error => {
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
      console.warn('All news sources failed, using curated fallback');
      return this.getCuratedFallbackNews();
    }

    // Shuffle and limit to 20 articles
    return this.shuffleArray(allNews).slice(0, 20);
  }

  private async fetchFromGuardian(): Promise<NewsItem[]> {
    const response = await fetch(
      'https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText,body&page-size=10'
    );
    
    if (!response.ok) throw new Error('Guardian API failed');
    
    const data = await response.json();
    
    return data.response.results.map((article: any, index: number) => ({
      id: `guardian-${article.id}`,
      headline: article.webTitle,
      tldr: article.fields?.trailText || this.generateTldr(article.webTitle),
      quote: article.fields?.trailText || '',
      author: 'The Guardian',
      category: article.sectionName || 'News',
      imageUrl: article.fields?.thumbnail || this.getPlaceholderImage(index),
      readTime: '3 min read',
      publishedAt: article.webPublicationDate,
      sourceUrl: article.webUrl
    }));
  }

  private async fetchFromNewsAPI(): Promise<NewsItem[]> {
    // Using free tier endpoints that don't require API key for top headlines
    const response = await fetch(
      'https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=demo'
    );
    
    if (!response.ok) throw new Error('NewsAPI failed');
    
    const data = await response.json();
    
    return (data.articles || []).map((article: any, index: number) => ({
      id: `newsapi-${Date.now()}-${index}`,
      headline: article.title,
      tldr: article.description || this.generateTldr(article.title),
      quote: article.description || '',
      author: article.author || article.source?.name || 'News Team',
      category: 'Breaking News',
      imageUrl: article.urlToImage || this.getPlaceholderImage(index),
      readTime: '2 min read',
      publishedAt: article.publishedAt,
      sourceUrl: article.url
    }));
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

  private async fetchFromCNN(): Promise<NewsItem[]> {
    try {
      const response = await fetch('http://rss.cnn.com/rss/edition.rss');
      const text = await response.text();
      return this.parseRSSFeed(text, 'CNN', 'cnn');
    } catch (error) {
      console.warn('CNN RSS failed:', error);
      return [];
    }
  }

  private async fetchFromHackerNews(): Promise<NewsItem[]> {
    try {
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStories = await topStoriesResponse.json();
      
      const stories = await Promise.all(
        topStories.slice(0, 10).map(async (id: number) => {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return storyResponse.json();
        })
      );

      return stories.filter(story => story && story.title).map((story, index) => ({
        id: `hn-${story.id}`,
        headline: story.title,
        tldr: this.generateTldr(story.title),
        quote: `${story.score} points • ${story.descendants || 0} comments`,
        author: story.by || 'HN User',
        category: 'Technology',
        imageUrl: this.getPlaceholderImage(index + 100),
        readTime: '2 min read',
        publishedAt: new Date(story.time * 1000).toISOString(),
        sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`
      }));
    } catch (error) {
      console.warn('Hacker News API failed:', error);
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
          quote: this.cleanDescription(description) || '',
          author: sourceName,
          category: 'World News',
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
    
    // Remove HTML tags and extra whitespace
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

  private getCuratedFallbackNews(): NewsItem[] {
    return [
      {
        id: 'curated-1',
        headline: 'Global Technology Summit Highlights AI Innovations',
        tldr: 'Leading tech companies showcased breakthrough AI technologies at the annual Global Technology Summit, focusing on practical applications in healthcare, education, and sustainable development.',
        quote: 'The summit brings together industry leaders to discuss the future of artificial intelligence.',
        author: 'Tech News Team',
        category: 'Technology',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '3 min read',
        publishedAt: new Date().toISOString(),
        sourceUrl: ''
      },
      {
        id: 'curated-2',
        headline: 'Climate Change Initiatives Show Promising Results',
        tldr: 'New renewable energy projects across multiple countries are exceeding expected performance metrics, contributing significantly to global carbon emission reduction goals.',
        quote: 'Renewable energy investments are paying off with measurable environmental impact.',
        author: 'Environmental Reporter',
        category: 'Environment',
        imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '4 min read',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceUrl: ''
      },
      {
        id: 'curated-3',
        headline: 'Scientific Breakthrough in Medical Research',
        tldr: 'Researchers announce significant progress in developing new treatment methods for chronic diseases, with clinical trials showing promising early results.',
        quote: 'This breakthrough could revolutionize treatment approaches for millions of patients.',
        author: 'Medical News',
        category: 'Health',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80',
        readTime: '5 min read',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceUrl: ''
      }
    ];
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
