
-- Add the missing foreign key relationship between story_cards and story_analysis
ALTER TABLE story_cards 
ADD CONSTRAINT fk_story_cards_analysis 
FOREIGN KEY (story_analysis_id) REFERENCES story_analysis(id) ON DELETE CASCADE;

-- Also ensure we have the story_analysis table structure if it doesn't exist
CREATE TABLE IF NOT EXISTS story_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE SET NULL,
  story_nature TEXT NOT NULL DEFAULT 'other',
  confidence_score NUMERIC DEFAULT 0.85,
  key_entities JSONB DEFAULT '[]'::jsonb,
  key_themes TEXT[] DEFAULT '{}',
  sentiment_score NUMERIC DEFAULT 0.5,
  complexity_level INTEGER DEFAULT 1,
  estimated_read_time INTEGER DEFAULT 300,
  template_id UUID REFERENCES story_templates(id) ON DELETE SET NULL,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the story_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_analysis_id UUID NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visual_data JSONB DEFAULT '{}'::jsonb,
  card_order INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create story_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  story_nature TEXT NOT NULL,
  card_sequence TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default story templates
INSERT INTO story_templates (name, story_nature, card_sequence, is_active) VALUES
('Policy Change Template', 'policy_change', ARRAY['overview', 'background', 'key_players', 'impact_analysis', 'next_steps'], true),
('Scandal Template', 'scandal', ARRAY['overview', 'background', 'key_players', 'public_reaction', 'next_steps'], true),
('Court Judgement Template', 'court_judgement', ARRAY['overview', 'background', 'key_players', 'impact_analysis', 'next_steps'], true),
('Political Move Template', 'political_move', ARRAY['overview', 'background', 'key_players', 'impact_analysis', 'public_reaction'], true),
('Economic Development Template', 'economic_development', ARRAY['overview', 'background', 'impact_analysis', 'key_players', 'next_steps'], true),
('General Template', 'other', ARRAY['overview', 'background', 'key_players', 'impact_analysis'], true)
ON CONFLICT DO NOTHING;

-- Enable RLS on the new tables
ALTER TABLE story_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_cards ENABLE ROW LEVEL SECURITY; 
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read story analysis" ON story_analysis FOR SELECT USING (true);
CREATE POLICY "Anyone can read story cards" ON story_cards FOR SELECT USING (true);
CREATE POLICY "Anyone can read story templates" ON story_templates FOR SELECT USING (true);
