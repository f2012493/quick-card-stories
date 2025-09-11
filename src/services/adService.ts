import { supabase } from '@/integrations/supabase/client';

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
  impressionId?: string;
}

interface AdStats {
  today: {
    total_impressions: number;
    total_clicks: number;
    total_revenue_cents: number;
    ctr: number;
    rpm_cents: number;
  };
  allTime: {
    total_impressions: number;
    total_clicks: number;
    total_revenue_cents: number;
    ctr: number;
    rpm_cents: number;
  };
}

export class AdService {
  private impressions: AdImpression[] = [];
  private totalRevenue: number = 0;
  private adsenseInitialized: boolean = false;
  private sessionId: string;
  private currentStats: AdStats | null = null;
  private publisherId: string | null = null;

  // Initialize Google AdSense
  private async initializeAdSense(): Promise<void> {
    if (this.adsenseInitialized) return;

    try {
      // Load AdSense script if not already loaded
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6962771066686971';
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

  // Fetch ads from secure endpoint (no sensitive pricing data exposed)
  async fetchAds(): Promise<AdUnit[]> {
    await this.initializeAdSense();

    try {
      // Use secure edge function to get ad display data without sensitive pricing info
      const { data, error } = await supabase.functions.invoke('get-ad-display');
      
      if (error) throw error;

      // Return ads from secure endpoint or fallback
      return data?.ads || this.getFallbackAds();
    } catch (error) {
      console.error('Failed to fetch ads from secure endpoint:', error);
      return this.getFallbackAds();
    }
  }

  private getFallbackAds(): AdUnit[] {
    return [
      {
        id: 'fallback_001',
        title: "Stay Updated",
        description: "Don't miss the latest news and updates",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
        ctaText: "Learn More",
        link: "#",
        revenue: 10,
        category: 'general'
      }
    ];
  }

  private getAdImage(category?: string): string {
    const images = {
      display: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
      premium: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop",
      subscription: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop",
      general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop"
    };
    return images[category as keyof typeof images] || images.general;
  }

  // Track when an ad is viewed
  async trackImpression(adId: string, revenue: number, userId?: string): Promise<string | null> {
    try {
      // Get device and location info
      const deviceInfo = this.getDeviceInfo();
      const locationData = await this.getLocationData();

      // Send to backend analytics
      const response = await supabase.functions.invoke('ad-analytics/impression', {
        body: {
          ad_id: adId,
          user_id: userId,
          session_id: this.sessionId,
          revenue_cents: revenue,
          device_info: deviceInfo,
          location_data: locationData
        }
      });

      if (response.error) {
        console.error('Error tracking impression:', response.error);
        return null;
      }

      const impression: AdImpression = {
        adId,
        timestamp: Date.now(),
        userId,
        revenue,
        wasClicked: false,
        impressionId: response.data.impression_id
      };

      this.impressions.push(impression);
      this.totalRevenue += revenue;
      
      // Store locally for persistence
      this.saveImpressions();
      
      console.log(`Ad impression tracked: ${adId}, Revenue: $${revenue / 100}`);
      
      // Send impression data to AdSense
      this.reportToAdSense('impression', adId);
      
      // Refresh stats
      await this.refreshStats();
      
      return response.data.impression_id;
    } catch (error) {
      console.error('Failed to track impression:', error);
      return null;
    }
  }

  // Track when an ad is clicked
  async trackClick(adId: string): Promise<void> {
    const impression = this.impressions.find(imp => 
      imp.adId === adId && !imp.wasClicked
    );
    
    if (impression && impression.impressionId) {
      try {
        const clickRevenue = impression.revenue * 5; // 5x revenue for clicks
        
        // Send to backend analytics
        const response = await supabase.functions.invoke('ad-analytics/click', {
          body: {
            impression_id: impression.impressionId,
            click_revenue_cents: clickRevenue
          }
        });

        if (response.error) {
          console.error('Error tracking click:', response.error);
          return;
        }

        impression.wasClicked = true;
        this.totalRevenue += clickRevenue;
        
        this.saveImpressions();
        console.log(`Ad click tracked: ${adId}, Bonus Revenue: $${clickRevenue / 100}`);
        
        // Report click to AdSense
        this.reportToAdSense('click', adId);
        
        // Refresh stats
        await this.refreshStats();
      } catch (error) {
        console.error('Failed to track click:', error);
      }
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
    return this.currentStats?.allTime.total_revenue_cents || this.totalRevenue;
  }

  // Get revenue for today
  getTodayRevenue(): number {
    return this.currentStats?.today.total_revenue_cents || 0;
  }

  // Get impression count
  getImpressionCount(): number {
    return this.currentStats?.allTime.total_impressions || this.impressions.length;
  }

  // Get click-through rate
  getClickThroughRate(): number {
    return this.currentStats?.allTime.ctr || 0;
  }

  // Get RPM (Revenue per mille)
  getRPM(): number {
    return this.currentStats?.allTime.rpm_cents || 0;
  }

  // Get current stats object
  getCurrentStats(): AdStats | null {
    return this.currentStats;
  }

  // Refresh stats from backend
  async refreshStats(): Promise<void> {
    try {
      const response = await supabase.functions.invoke('ad-analytics/stats');
      
      if (!response.error && response.data) {
        this.currentStats = response.data;
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
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

  private getDeviceInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: navigator.language,
      platform: navigator.platform
    };
  }

  private async getLocationData(): Promise<Record<string, any>> {
    try {
      // Get approximate location from IP (you could use a service like ipapi.co)
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name,
          region: data.region,
          city: data.city,
          timezone: data.timezone
        };
      }
    } catch (error) {
      console.warn('Failed to get location data:', error);
    }
    
    return {};
  }

  constructor() {
    this.loadImpressions();
    this.sessionId = this.generateSessionId();
    this.refreshStats();
    this.initializeAdSenseConfig();
  }

  private async initializeAdSenseConfig(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-adsense-config', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!error && data?.publisherId) {
        this.publisherId = data.publisherId;
      }
    } catch (error) {
      console.warn('Failed to load AdSense configuration:', error);
    }
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const adService = new AdService();
