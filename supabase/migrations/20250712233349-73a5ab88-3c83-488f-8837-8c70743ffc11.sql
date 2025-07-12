
-- Phase 1: Database Schema Overhaul for antiNews Video-Style Feed

-- Create video_content table for storing generated video metadata
CREATE TABLE public.video_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  video_url TEXT,
  audio_url TEXT,
  subtitle_data JSONB, -- stores word-by-word timing data
  background_music_url TEXT,
  video_duration_seconds INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trust_scores table for Elo-style user-driven rating system
CREATE TABLE public.trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trust_vote BOOLEAN NOT NULL, -- true for trust, false for distrust
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, user_id) -- one vote per user per article
);

-- Create content_summaries table for AI-generated TL;DR variants
CREATE TABLE public.content_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  extractive_summary TEXT,
  abstractive_summary TEXT,
  summary_type TEXT DEFAULT 'auto', -- auto, user_preferred
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ad_placements table for strategic ad positioning
CREATE TABLE public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ad_position INTEGER NOT NULL, -- position in feed (every 8th story)
  ad_video_url TEXT,
  ad_title TEXT,
  ad_sponsor TEXT,
  contextual_tags TEXT[], -- for behavioral matching
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to existing articles table for video-style content
ALTER TABLE public.articles 
ADD COLUMN video_generated BOOLEAN DEFAULT false,
ADD COLUMN trust_score NUMERIC DEFAULT 0.5,
ADD COLUMN local_relevance_score NUMERIC DEFAULT 0.0,
ADD COLUMN video_processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN content_type TEXT DEFAULT 'news'; -- news, sports, entertainment

-- Enhance user_profiles for subscription tiers and content consumption
ALTER TABLE public.user_profiles
ADD COLUMN daily_article_limit INTEGER DEFAULT 20,
ADD COLUMN articles_consumed_today INTEGER DEFAULT 0,
ADD COLUMN last_consumption_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN trust_voting_count INTEGER DEFAULT 0,
ADD COLUMN preferred_summary_type TEXT DEFAULT 'auto', -- auto, extractive, abstractive
ADD COLUMN content_preferences JSONB DEFAULT '{"sports": true, "entertainment": true, "politics": true}',
ADD COLUMN ad_personalization_consent BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_video_content_article_id ON public.video_content(article_id);
CREATE INDEX idx_trust_scores_article_id ON public.trust_scores(article_id);
CREATE INDEX idx_trust_scores_user_id ON public.trust_scores(user_id);
CREATE INDEX idx_content_summaries_article_id ON public.content_summaries(article_id);
CREATE INDEX idx_ad_placements_user_id ON public.ad_placements(user_id);
CREATE INDEX idx_articles_trust_score ON public.articles(trust_score DESC);
CREATE INDEX idx_articles_video_generated ON public.articles(video_generated);

-- Enable RLS on new tables
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_content (public read, system write)
CREATE POLICY "Anyone can view video content"
  ON public.video_content FOR SELECT
  USING (true);

-- RLS policies for trust_scores (users can manage their own votes)
CREATE POLICY "Users can view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own trust votes"
  ON public.trust_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trust votes"
  ON public.trust_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for content_summaries (public read)
CREATE POLICY "Anyone can view content summaries"
  ON public.content_summaries FOR SELECT
  USING (true);

-- RLS policies for ad_placements (users see their targeted ads)
CREATE POLICY "Users can view their targeted ads"
  ON public.ad_placements FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to reset daily article consumption
CREATE OR REPLACE FUNCTION reset_daily_consumption()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    articles_consumed_today = 0,
    last_consumption_reset = CURRENT_DATE
  WHERE last_consumption_reset < CURRENT_DATE;
END;
$$;

-- Function to calculate article trust score based on votes
CREATE OR REPLACE FUNCTION calculate_trust_score(article_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trust_votes INTEGER;
  total_votes INTEGER;
  trust_ratio NUMERIC;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE trust_vote = true),
    COUNT(*)
  INTO trust_votes, total_votes
  FROM public.trust_scores 
  WHERE article_id = article_uuid;
  
  IF total_votes = 0 THEN
    RETURN 0.5; -- neutral score for no votes
  END IF;
  
  trust_ratio := trust_votes::NUMERIC / total_votes::NUMERIC;
  
  -- Update the article's trust score
  UPDATE public.articles 
  SET trust_score = trust_ratio
  WHERE id = article_uuid;
  
  RETURN trust_ratio;
END;
$$;
