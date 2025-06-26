interface AdUnit {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  link: string;
  revenue: number; // Revenue per view in cents
  category?: string;
  adUnitId?: string; // AdSense ad unit ID
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
  private adsenseInitialized: boolean = false;

  // Initialize Google AdSense
  private async initializeAdSense(): Promise<void> {
    if (this.adsenseInitialized) return;

    try {
      // Load AdSense script if not already loaded
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Initialize AdSense
      if (window.adsbygoogle) {
        window.adsbygoogle = window.adsbygoogle || [];
      }

      this.adsenseInitialized = true;
      console.log('AdSense initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdSense:', error);
    }
  }

  // Fetch ads from AdSense (in production, this would be server-side)
  async fetchAds(): Promise<AdUnit[]> {
    await this.initializeAdSense();

    // In production, you would fetch actual ad configurations from your backend
    // which would communicate with AdSense API
    const ads: AdUnit[] = [
      {
        id: 'adsense_display_001',
        title: "Sponsored Content",
        description: "This content is brought to you by our advertising partners",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
        ctaText: "Learn More",
        link: "#",
        revenue: 25, // Estimated CPM in cents
        category: 'display',
        adUnitId: 'ca-app-pub-YOUR_PUBLISHER_ID/AD_UNIT_ID_1'
      },
      {
        id: 'adsense_display_002',
        title: "Premium Experience",
        description: "Discover premium content and exclusive offers",
        imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop",
        ctaText: "Explore Now",
        link: "#",
        revenue: 45,
        category: 'premium',
        adUnitId: 'ca-app-pub-YOUR_PUBLISHER_ID/AD_UNIT_ID_2'
      },
      {
        id: 'adsense_display_003',
        title: "Stay Connected",
        description: "Don't miss out on the latest updates and news",
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop",
        ctaText: "Subscribe",
        link: "#",
        revenue: 15,
        category: 'subscription',
        adUnitId: 'ca-app-pub-YOUR_PUBLISHER_ID/AD_UNIT_ID_3'
      }
    ];

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
    
    // Send impression data to AdSense
    this.reportToAdSense('impression', adId);
    
    // Send to your analytics service
    this.sendToAnalytics(impression);
  }

  // Track when an ad is clicked
  trackClick(adId: string): void {
    const impression = this.impressions.find(imp => 
      imp.adId === adId && !imp.wasClicked
    );
    
    if (impression) {
      impression.wasClicked = true;
      // Click bonus revenue (AdSense typically pays more for clicks)
      const clickRevenue = impression.revenue * 5; // 5x revenue for clicks
      this.totalRevenue += clickRevenue;
      
      this.saveImpressions();
      console.log(`Ad click tracked: ${adId}, Bonus Revenue: $${clickRevenue / 100}`);
      
      // Report click to AdSense
      this.reportToAdSense('click', adId);
    }
  }

  // Report events to AdSense
  private reportToAdSense(event: 'impression' | 'click', adId: string): void {
    try {
      // In production, use AdSense reporting API
      if (window.gtag) {
        window.gtag('event', event, {
          event_category: 'advertisement',
          event_label: adId,
          value: event === 'click' ? 1 : 0
        });
      }
    } catch (error) {
      console.warn('Failed to report to AdSense:', error);
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
      .reduce((total, imp) => total + imp.revenue + (imp.wasClicked ? imp.revenue * 5 : 0), 0);
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
    try {
      // Send to your backend analytics service
      await fetch('/api/analytics/ad-impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(impression)
      });
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  constructor() {
    this.loadImpressions();
  }
}

export const adService = new AdService();
