/*
  # Add Story Breakdown Column

  1. New Columns
    - `story_breakdown` (text) - Simple explanation of complex news content
    - `story_nature` (text) - Nature/category of the story (policy, scandal, etc.)
    - `analysis_confidence` (numeric) - Confidence score of the analysis

  2. Security
    - No RLS changes needed as articles table already has public read access
*/

-- Add new columns to articles table for Perplexity analysis
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS story_breakdown TEXT,
ADD COLUMN IF NOT EXISTS story_nature TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS analysis_confidence NUMERIC DEFAULT 0.0;

-- Create index for story nature queries
CREATE INDEX IF NOT EXISTS idx_articles_story_nature ON public.articles(story_nature);

-- Create index for analysis confidence
CREATE INDEX IF NOT EXISTS idx_articles_analysis_confidence ON public.articles(analysis_confidence DESC);