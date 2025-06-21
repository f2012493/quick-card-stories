interface NewsAnalytics {
  newsId: string;
  timeSpent: number;
  wasExplored: boolean;
  timestamp: number;
  category: string;
}

export class AnalyticsService {
  private startTime: number | null = null;
  private currentNewsId: string | null = null;
  private analytics: NewsAnalytics[] = [];

  startTracking(newsId: string, category: string): void {
    // Save previous session if exists
    this.endTracking();
    
    this.currentNewsId = newsId;
    this.startTime = Date.now();
    
    console.log(`Started tracking news: ${newsId}`);
  }

  endTracking(wasExplored: boolean = false): void {
    if (this.startTime && this.currentNewsId) {
      const timeSpent = Date.now() - this.startTime;
      
      const analytics: NewsAnalytics = {
        newsId: this.currentNewsId,
        timeSpent,
        wasExplored,
        timestamp: Date.now(),
        category: 'general' // Will be updated from the news item
      };

      this.analytics.push(analytics);
      
      // Store in localStorage for persistence
      this.saveAnalytics();
      
      console.log(`Tracked news ${this.currentNewsId}: ${timeSpent}ms, explored: ${wasExplored}`);
    }

    this.startTime = null;
    this.currentNewsId = null;
  }

  markAsExplored(): void {
    if (this.currentNewsId) {
      // Update the current tracking session
      const existing = this.analytics.find(a => a.newsId === this.currentNewsId);
      if (existing) {
        existing.wasExplored = true;
      }
      console.log(`Marked news ${this.currentNewsId} as explored`);
    }
  }

  private saveAnalytics(): void {
    try {
      // Keep only last 100 entries to prevent localStorage bloat
      const recentAnalytics = this.analytics.slice(-100);
      localStorage.setItem('newsAnalytics', JSON.stringify(recentAnalytics));
    } catch (error) {
      console.warn('Failed to save analytics:', error);
    }
  }

  private loadAnalytics(): void {
    try {
      const stored = localStorage.getItem('newsAnalytics');
      if (stored) {
        this.analytics = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics:', error);
      this.analytics = [];
    }
  }

  getAnalytics(): NewsAnalytics[] {
    return [...this.analytics];
  }

  getAverageTimeSpent(): number {
    if (this.analytics.length === 0) return 0;
    const total = this.analytics.reduce((sum, item) => sum + item.timeSpent, 0);
    return total / this.analytics.length;
  }

  getExplorationRate(): number {
    if (this.analytics.length === 0) return 0;
    const explored = this.analytics.filter(item => item.wasExplored).length;
    return explored / this.analytics.length;
  }

  constructor() {
    this.loadAnalytics();
  }
}

export const analyticsService = new AnalyticsService();
