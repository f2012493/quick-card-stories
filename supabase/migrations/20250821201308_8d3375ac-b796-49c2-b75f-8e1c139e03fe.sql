-- Create tables for ad tracking and revenue management

-- Ad impressions table to track when ads are shown
CREATE TABLE public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id TEXT NOT NULL,
  ad_unit_id TEXT, -- AdSense ad unit ID
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revenue_cents INTEGER DEFAULT 0,
  device_info JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',
  was_clicked BOOLEAN DEFAULT false,
  click_timestamp TIMESTAMP WITH TIME ZONE,
  click_revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ad units configuration table
CREATE TABLE public.ad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adsense_unit_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cpm_cents INTEGER DEFAULT 0, -- Cost per mille in cents
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily ad revenue summary for reporting
CREATE TABLE public.ad_revenue_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  click_revenue_cents INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  rpm_cents INTEGER DEFAULT 0, -- Revenue per mille
  adsense_earnings_cents INTEGER DEFAULT 0, -- Actual AdSense earnings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_revenue_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_impressions
CREATE POLICY "Users can insert their own ad impressions" ON public.ad_impressions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all ad impressions" ON public.ad_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND subscription_status = 'admin'
    )
  );

-- RLS Policies for ad_units (public read, admin write)
CREATE POLICY "Anyone can view active ad units" ON public.ad_units
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ad units" ON public.ad_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND subscription_status = 'admin'
    )
  );

-- RLS Policies for ad_revenue_summary (admin only)
CREATE POLICY "Admins can manage ad revenue summary" ON public.ad_revenue_summary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND subscription_status = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_ad_impressions_timestamp ON public.ad_impressions(timestamp);
CREATE INDEX idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_ad_id ON public.ad_impressions(ad_id);
CREATE INDEX idx_ad_revenue_summary_date ON public.ad_revenue_summary(date);

-- Insert some initial ad units
INSERT INTO public.ad_units (adsense_unit_id, title, description, category, cmp_cents) VALUES
  ('ca-app-pub-6962771066686971/5939742256', 'Sponsored Content', 'Premium advertising content', 'display', 250),
  ('ca-app-pub-6962771066686971/1932214485', 'Premium Experience', 'Exclusive offers and content', 'premium', 450),
  ('ca-app-pub-6962771066686971/7061252239', 'Stay Connected', 'Newsletter and updates', 'subscription', 150);