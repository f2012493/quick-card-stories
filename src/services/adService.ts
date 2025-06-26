
interface AdUnit {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  link: string;
  revenue: number; // Revenue per view in cents
  category?: string;
}

interface AdImpression {
  adId: string;
  timestamp: number;
  userId?: string;
  revenue: number;
  wasClicked: boolean;
}

export class AdService {
  private impressions: AdImpression[] = [];
  private totalRevenue: number = 0;

  // In a real implementation, this would fetch from Google AdSense API
  async fetchAds(): Promise<AdUnit[]> {
    // Simulate fetching ads from an ad network
    const ads: AdUnit[] = [
      {
        id: 'ad_001',
        title: "Discover New Perspectives",
        description: "Stay informed with breaking news from around the world",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
        ctaText: "Learn More",
        link: "https://example.com/news",
        revenue: 25, // 25 cents per view
        category: 'news'
      },
      {
        id: 'ad_002',
        title: "Premium News Experience",
        description: "Get unlimited access to in-depth analysis and exclusive content",
        imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop",
        ctaText: "Try Premium",
        link: "https://example.com/premium",
        revenue: 45, // 45 cents per view
        category: 'subscription'
      },
      {
        id: 'ad_003',
        title: "Stay Connected",
        description: "Never miss important updates with our notification system",
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop",
        ctaText: "Enable Notifications",
        link: "https://example.com/notifications",
        revenue: 15, // 15 cents per view
        category: 'app'
      },
      {
        id: 'ad_004',
        title: "Tech Innovation Hub",
        description: "Explore the latest in technology and innovation",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        ctaText: "Explore Tech",
        link: "https://example.com/tech",
        revenue: 35, // 35 cents per view
        category: 'technology'
      }
    ];

    // In production, you would make an API call here:
    // const response = await fetch('/api/ads');
    // return response.json();
    
    return ads;
  }

  // Track when an ad is viewed
  trackImpression(adId: string, revenue: number, userId?: string): void {
    const impression: AdImpression = {
      adId,
      timestamp: Date.now(),
      userId,
      revenue,
      wasClicked: false
    };

    this.impressions.push(impression);
    this.totalRevenue += revenue;
    
    // Store locally for persistence
    this.saveImpressions();
    
    console.log(`Ad impression tracked: ${adId}, Revenue: $${revenue / 100}`);
    
    // In production, send to analytics service
    this.sendToAnalytics(impression);
  }

  // Track when an ad is clicked
  trackClick(adId: string): void {
    const impression = this.impressions.find(imp => 
      imp.adId === adId && !imp.wasClicked
    );
    
    if (impression) {
      impression.wasClicked = true;
      // Click bonus revenue (typically higher)
      const clickRevenue = impression.revenue * 3; // 3x revenue for clicks
      this.totalRevenue += clickRevenue;
      
      this.saveImpressions();
      console.log(`Ad click tracked: ${adId}, Bonus Revenue: $${clickRevenue / 100}`);
    }
  }

  // Get total revenue earned
  getTotalRevenue(): number {
    return this.totalRevenue;
  }

  // Get revenue for today
  getTodayRevenue(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.impressions
      .filter(imp => imp.timestamp >= today.getTime())
      .reduce((total, imp) => total + imp.revenue + (imp.wasClicked ? imp.revenue * 3 : 0), 0);
  }

  // Get impression count
  getImpressionCount(): number {
    return this.impressions.length;
  }

  // Get click-through rate
  getClickThroughRate(): number {
    const totalImpressions = this.impressions.length;
    const totalClicks = this.impressions.filter(imp => imp.wasClicked).length;
    
    return totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  }

  private saveImpressions(): void {
    try {
      const data = {
        impressions: this.impressions.slice(-500), // Keep last 500 impressions
        totalRevenue: this.totalRevenue
      };
      localStorage.setItem('adImpressions', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save ad impressions:', error);
    }
  }

  private loadImpressions(): void {
    try {
      const stored = localStorage.getItem('adImpressions');
      if (stored) {
        const data = JSON.parse(stored);
        this.impressions = data.impressions || [];
        this.totalRevenue = data.totalRevenue || 0;
      }
    } catch (error) {
      console.warn('Failed to load ad impressions:', error);
      this.impressions = [];
      this.totalRevenue = 0;
    }
  }

  private async sendToAnalytics(impression: AdImpression): Promise<void> {
    // In production, send to your analytics service or Google Analytics
    try {
      // Example: await fetch('/api/analytics/ad-impression', {
      //   method: 'POST',
      //   body: JSON.stringify(impression)
      // });
      console.log('Analytics sent:', impression);
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  constructor() {
    this.loadImpressions();
  }
}

export const adService = new AdService();
