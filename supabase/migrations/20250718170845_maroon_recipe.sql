/*
  # Story Analysis and Modular Templates

  1. New Tables
    - `story_analysis` - Stores detected story nature and analysis
    - `story_templates` - Defines modular templates for different story types
    - `story_cards` - Individual cards for each story with structured content
    - `story_card_templates` - Template definitions for different card types

  2. Security
    - Enable RLS on all new tables
    - Add policies for public read access and system write access

  3. Features
    - Story nature detection (policy, scandal, court, political, etc.)
    - Modular template system for different story types
    - Structured card content for better user understanding
    - Swipeable card interface support
*/

-- Create enum for story nature types
CREATE TYPE story_nature AS ENUM (
  'policy_change',
  'scandal',
  'court_judgement',
  'political_move',
  'economic_development',
  'social_issue',
  'international_relations',
  'technology_advancement',
  'environmental_issue',
  'health_development',
  'education_reform',
  'infrastructure_project',
  'security_incident',
  'cultural_event',
  'sports_achievement',
  'business_merger',
  'regulatory_change',
  'election_update',
  'protest_movement',
  'natural_disaster',
  'scientific_discovery',
  'other'
);

-- Create enum for card types
CREATE TYPE card_type AS ENUM (
  'overview',
  'background',
  'key_players',
  'timeline',
  'impact_analysis',
  'public_reaction',
  'expert_opinion',
  'related_context',
  'next_steps',
  'data_visualization',
  'comparison',
  'fact_check'
);

-- Story analysis table
CREATE TABLE IF NOT EXISTS public.story_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE CASCADE,
  story_nature story_nature NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  key_entities JSONB DEFAULT '[]', -- People, organizations, locations mentioned
  key_themes TEXT[] DEFAULT '{}', -- Main themes/topics
  sentiment_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1 scale
  complexity_level INTEGER DEFAULT 1 CHECK (complexity_level BETWEEN 1 AND 5),
  estimated_read_time INTEGER DEFAULT 120, -- seconds
  template_id UUID REFERENCES public.story_templates(id),
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id)
);

-- Story templates table
CREATE TABLE IF NOT EXISTS public.story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  story_nature story_nature NOT NULL,
  description TEXT,
  card_sequence card_type[] NOT NULL, -- Ordered sequence of card types
  template_config JSONB DEFAULT '{}', -- Configuration for template behavior
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Story cards table
CREATE TABLE IF NOT EXISTS public.story_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_analysis_id UUID REFERENCES public.story_analysis(id) ON DELETE CASCADE,
  card_type card_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visual_data JSONB DEFAULT '{}', -- Charts, images, infographics data
  card_order INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Story card templates table
CREATE TABLE IF NOT EXISTS public.story_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type card_type NOT NULL,
  template_name TEXT NOT NULL,
  content_structure JSONB NOT NULL, -- Defines how content should be structured
  visual_config JSONB DEFAULT '{}', -- Visual presentation configuration
  prompt_template TEXT, -- Template for AI content generation
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_story_analysis_article_id ON public.story_analysis(article_id);
CREATE INDEX idx_story_analysis_cluster_id ON public.story_analysis(cluster_id);
CREATE INDEX idx_story_analysis_nature ON public.story_analysis(story_nature);
CREATE INDEX idx_story_cards_analysis_id ON public.story_cards(story_analysis_id);
CREATE INDEX idx_story_cards_order ON public.story_cards(story_analysis_id, card_order);
CREATE INDEX idx_story_templates_nature ON public.story_templates(story_nature);

-- Enable RLS on all tables
ALTER TABLE public.story_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_card_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read story analysis"
  ON public.story_analysis FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read story templates"
  ON public.story_templates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read story cards"
  ON public.story_cards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read story card templates"
  ON public.story_card_templates FOR SELECT
  USING (true);

-- Insert default story templates
INSERT INTO public.story_templates (name, story_nature, description, card_sequence, template_config) VALUES
('Policy Change Analysis', 'policy_change', 'Template for analyzing policy changes and their implications', 
 ARRAY['overview', 'background', 'key_players', 'impact_analysis', 'public_reaction', 'next_steps']::card_type[], 
 '{"focus": "policy_impact", "include_timeline": true}'),

('Scandal Investigation', 'scandal', 'Template for breaking down scandals and controversies',
 ARRAY['overview', 'key_players', 'timeline', 'impact_analysis', 'public_reaction', 'next_steps']::card_type[],
 '{"focus": "accountability", "include_evidence": true}'),

('Court Judgement Breakdown', 'court_judgement', 'Template for explaining court decisions and legal implications',
 ARRAY['overview', 'background', 'key_players', 'timeline', 'impact_analysis', 'next_steps']::card_type[],
 '{"focus": "legal_implications", "include_precedents": true}'),

('Political Move Analysis', 'political_move', 'Template for analyzing political strategies and maneuvers',
 ARRAY['overview', 'background', 'key_players', 'impact_analysis', 'public_reaction', 'next_steps']::card_type[],
 '{"focus": "political_strategy", "include_opposition_response": true}'),

('Economic Development', 'economic_development', 'Template for economic news and market developments',
 ARRAY['overview', 'data_visualization', 'impact_analysis', 'expert_opinion', 'next_steps']::card_type[],
 '{"focus": "economic_impact", "include_market_data": true}'),

('Social Issue Deep Dive', 'social_issue', 'Template for social issues and community concerns',
 ARRAY['overview', 'background', 'impact_analysis', 'public_reaction', 'expert_opinion', 'next_steps']::card_type[],
 '{"focus": "social_impact", "include_community_voices": true}');

-- Insert default card templates
INSERT INTO public.story_card_templates (card_type, template_name, content_structure, prompt_template) VALUES
('overview', 'Standard Overview', 
 '{"sections": ["what_happened", "why_important", "key_takeaway"], "max_length": 200}',
 'Provide a clear, concise overview of what happened, why it matters, and the key takeaway in under 200 words.'),

('background', 'Context Provider',
 '{"sections": ["historical_context", "relevant_policies", "previous_events"], "max_length": 250}',
 'Explain the background context, including relevant history, policies, and previous related events.'),

('key_players', 'Stakeholder Analysis',
 '{"sections": ["primary_actors", "affected_parties", "decision_makers"], "format": "list"}',
 'Identify and explain the roles of key people, organizations, and groups involved or affected.'),

('timeline', 'Event Sequence',
 '{"sections": ["chronological_events"], "format": "timeline", "max_events": 8}',
 'Create a chronological timeline of key events leading up to and following this development.'),

('impact_analysis', 'Impact Assessment',
 '{"sections": ["immediate_effects", "long_term_implications", "affected_groups"], "max_length": 300}',
 'Analyze the immediate and long-term impacts, identifying who will be most affected and how.'),

('public_reaction', 'Public Response',
 '{"sections": ["public_opinion", "media_coverage", "social_media_sentiment"], "max_length": 250}',
 'Summarize public reaction, media coverage, and general sentiment around this development.'),

('next_steps', 'What Happens Next',
 '{"sections": ["immediate_actions", "future_developments", "things_to_watch"], "max_length": 200}',
 'Outline what immediate actions are expected and what developments to watch for next.');

-- Function to analyze story nature
CREATE OR REPLACE FUNCTION analyze_story_nature(
  article_title TEXT,
  article_content TEXT,
  article_description TEXT DEFAULT ''
)
RETURNS story_nature
LANGUAGE plpgsql
AS $$
DECLARE
  full_text TEXT;
  detected_nature story_nature;
BEGIN
  full_text := LOWER(COALESCE(article_title, '') || ' ' || COALESCE(article_description, '') || ' ' || COALESCE(article_content, ''));
  
  -- Policy change detection
  IF full_text ~ '(policy|regulation|rule|guideline|framework|reform|amendment|bill|act|law)' AND
     full_text ~ '(change|new|introduce|implement|announce|approve|pass)' THEN
    detected_nature := 'policy_change';
  
  -- Scandal detection
  ELSIF full_text ~ '(scandal|corruption|bribe|fraud|misconduct|allegation|investigate|probe)' THEN
    detected_nature := 'scandal';
  
  -- Court judgement detection
  ELSIF full_text ~ '(court|judge|verdict|ruling|sentence|appeal|supreme court|high court|tribunal)' THEN
    detected_nature := 'court_judgement';
  
  -- Political move detection
  ELSIF full_text ~ '(election|campaign|party|minister|opposition|coalition|vote|parliament|assembly)' THEN
    detected_nature := 'political_move';
  
  -- Economic development detection
  ELSIF full_text ~ '(economy|market|gdp|inflation|growth|business|trade|investment|stock|rupee)' THEN
    detected_nature := 'economic_development';
  
  -- Technology advancement detection
  ELSIF full_text ~ '(technology|ai|digital|startup|innovation|tech|software|app|cyber)' THEN
    detected_nature := 'technology_advancement';
  
  -- Health development detection
  ELSIF full_text ~ '(health|medical|hospital|vaccine|disease|treatment|doctor|patient)' THEN
    detected_nature := 'health_development';
  
  -- Environmental issue detection
  ELSIF full_text ~ '(environment|climate|pollution|green|carbon|renewable|forest|wildlife)' THEN
    detected_nature := 'environmental_issue';
  
  -- Security incident detection
  ELSIF full_text ~ '(security|terror|attack|violence|crime|police|arrest|incident)' THEN
    detected_nature := 'security_incident';
  
  -- International relations detection
  ELSIF full_text ~ '(international|foreign|embassy|diplomat|treaty|border|trade deal)' THEN
    detected_nature := 'international_relations';
  
  -- Default to other
  ELSE
    detected_nature := 'other';
  END IF;
  
  RETURN detected_nature;
END;
$$;

-- Function to generate story cards based on template
CREATE OR REPLACE FUNCTION generate_story_cards(
  analysis_id UUID,
  template_id UUID,
  article_title TEXT,
  article_content TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  template_record RECORD;
  card_template RECORD;
  card_order_num INTEGER := 1;
  current_card_type card_type;
BEGIN
  -- Get template configuration
  SELECT * INTO template_record FROM public.story_templates WHERE id = template_id;
  
  -- Generate cards for each type in the template sequence
  FOREACH current_card_type IN ARRAY template_record.card_sequence
  LOOP
    -- Get the default template for this card type
    SELECT * INTO card_template 
    FROM public.story_card_templates 
    WHERE card_type = current_card_type AND is_default = true
    LIMIT 1;
    
    -- If no default template, get any template for this card type
    IF card_template IS NULL THEN
      SELECT * INTO card_template 
      FROM public.story_card_templates 
      WHERE card_type = current_card_type
      LIMIT 1;
    END IF;
    
    -- Generate card content based on card type
    INSERT INTO public.story_cards (
      story_analysis_id,
      card_type,
      title,
      content,
      card_order,
      metadata
    ) VALUES (
      analysis_id,
      current_card_type,
      CASE current_card_type
        WHEN 'overview' THEN 'What Happened'
        WHEN 'background' THEN 'Background Context'
        WHEN 'key_players' THEN 'Key Players'
        WHEN 'timeline' THEN 'Timeline of Events'
        WHEN 'impact_analysis' THEN 'Impact Analysis'
        WHEN 'public_reaction' THEN 'Public Reaction'
        WHEN 'next_steps' THEN 'What''s Next'
        ELSE INITCAP(REPLACE(current_card_type::TEXT, '_', ' '))
      END,
      -- Generate basic content (in production, this would use AI)
      CASE current_card_type
        WHEN 'overview' THEN SUBSTRING(article_content, 1, 200) || '...'
        WHEN 'background' THEN 'This development builds on previous events and policies in this area.'
        WHEN 'key_players' THEN 'Key stakeholders and decision-makers involved in this story.'
        WHEN 'timeline' THEN 'Chronological sequence of events leading to this development.'
        WHEN 'impact_analysis' THEN 'Analysis of immediate and long-term implications of this development.'
        WHEN 'public_reaction' THEN 'Public and media response to this development.'
        WHEN 'next_steps' THEN 'Expected next steps and future developments to watch.'
        ELSE 'Additional context and information about this story.'
      END,
      card_order_num,
      COALESCE(card_template.content_structure, '{}')
    );
    
    card_order_num := card_order_num + 1;
  END LOOP;
END;
$$;

-- Function to process article for story analysis
CREATE OR REPLACE FUNCTION process_article_for_story_analysis(article_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  article_record RECORD;
  detected_nature story_nature;
  template_record RECORD;
  analysis_id UUID;
  confidence DECIMAL(3,2) := 0.8;
BEGIN
  -- Get article data
  SELECT * INTO article_record FROM public.articles WHERE id = article_id;
  
  IF article_record IS NULL THEN
    RAISE EXCEPTION 'Article not found: %', article_id;
  END IF;
  
  -- Analyze story nature
  detected_nature := analyze_story_nature(
    article_record.title,
    article_record.content,
    article_record.description
  );
  
  -- Get appropriate template
  SELECT * INTO template_record 
  FROM public.story_templates 
  WHERE story_nature = detected_nature AND is_active = true
  LIMIT 1;
  
  -- Create story analysis record
  INSERT INTO public.story_analysis (
    article_id,
    cluster_id,
    story_nature,
    confidence_score,
    template_id,
    analysis_metadata
  ) VALUES (
    article_id,
    article_record.cluster_id,
    detected_nature,
    confidence,
    template_record.id,
    jsonb_build_object(
      'processed_at', now(),
      'template_used', template_record.name,
      'word_count', LENGTH(SPLIT_PART(article_record.content, ' ', 999999))
    )
  ) RETURNING id INTO analysis_id;
  
  -- Generate story cards
  IF template_record.id IS NOT NULL THEN
    PERFORM generate_story_cards(
      analysis_id,
      template_record.id,
      article_record.title,
      article_record.content
    );
  END IF;
  
  RETURN analysis_id;
END;
$$;