
-- Create story_analysis table
CREATE TABLE public.story_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  story_nature text NOT NULL DEFAULT 'other',
  confidence_score numeric DEFAULT 0.85,
  key_entities jsonb DEFAULT '[]'::jsonb,
  key_themes text[] DEFAULT ARRAY[]::text[],
  sentiment_score numeric DEFAULT 0.5,
  complexity_level integer DEFAULT 1,
  estimated_read_time integer DEFAULT 300,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create story_cards table
CREATE TABLE public.story_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_analysis_id uuid REFERENCES public.story_analysis(id) ON DELETE CASCADE,
  card_type text NOT NULL,
  title text NOT NULL,
  content text,
  visual_data jsonb,
  card_order integer DEFAULT 1,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create story_templates table (referenced in the service)
CREATE TABLE public.story_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  template_config jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.story_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_analysis
CREATE POLICY "Anyone can read story analysis" ON public.story_analysis
  FOR SELECT USING (true);

-- RLS policies for story_cards  
CREATE POLICY "Anyone can read story cards" ON public.story_cards
  FOR SELECT USING (true);

-- RLS policies for story_templates
CREATE POLICY "Anyone can read story templates" ON public.story_templates
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_story_analysis_article_id ON public.story_analysis(article_id);
CREATE INDEX idx_story_cards_analysis_id ON public.story_cards(story_analysis_id);
CREATE INDEX idx_story_cards_order ON public.story_cards(story_analysis_id, card_order);
