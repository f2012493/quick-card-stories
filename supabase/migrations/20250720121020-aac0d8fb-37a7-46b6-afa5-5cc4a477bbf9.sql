
-- Add missing columns to articles table for story analysis
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS story_breakdown TEXT,
ADD COLUMN IF NOT EXISTS story_nature TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS analysis_confidence NUMERIC DEFAULT 0.0;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_articles_story_nature ON public.articles(story_nature);
CREATE INDEX IF NOT EXISTS idx_articles_analysis_confidence ON public.articles(analysis_confidence DESC);
