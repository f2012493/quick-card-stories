
-- Enable the pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for source trust levels
CREATE TYPE source_trust_level AS ENUM ('low', 'medium', 'high', 'verified');

-- Create enum for article status
CREATE TYPE article_status AS ENUM ('active', 'stale', 'archived');

-- Create enum for cluster status
CREATE TYPE cluster_status AS ENUM ('active', 'trending', 'stale', 'archived');

-- Create news sources table with trust scores
CREATE TABLE public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  trust_score DECIMAL(3,2) DEFAULT 0.50 CHECK (trust_score >= 0 AND trust_score <= 1),
  trust_level source_trust_level DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create articles table for ingested news
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id),
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status article_status DEFAULT 'active',
  content_hash TEXT, -- For duplicate detection
  title_embedding VECTOR(1536), -- OpenAI embeddings for similarity
  content_embedding VECTOR(1536),
  region_tags TEXT[], -- Extracted location mentions
  category TEXT,
  clickbait_score DECIMAL(3,2) DEFAULT 0, -- 0-1 score for clickbait detection
  quality_score DECIMAL(3,2) DEFAULT 0.5, -- Overall quality assessment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create story clusters table
CREATE TABLE public.story_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- Representative title for the cluster
  description TEXT, -- Summary of the story
  category TEXT,
  status cluster_status DEFAULT 'active',
  article_count INTEGER DEFAULT 0,
  earliest_published_at TIMESTAMP WITH TIME ZONE,
  latest_published_at TIMESTAMP WITH TIME ZONE,
  
  -- Scoring factors
  freshness_score DECIMAL(3,2) DEFAULT 0,
  newsworthiness_score DECIMAL(3,2) DEFAULT 0, -- Based on source count
  authority_score DECIMAL(3,2) DEFAULT 0, -- Average source trust
  originality_score DECIMAL(3,2) DEFAULT 0, -- Based on earliest article
  quality_score DECIMAL(3,2) DEFAULT 0, -- Average article quality
  
  -- Overall computed score
  base_score DECIMAL(5,2) DEFAULT 0, -- Score without personalization
  
  -- Metadata
  representative_image_url TEXT,
  region_tags TEXT[], -- Regions this story is relevant to
  trending_regions TEXT[], -- Where it's currently trending
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- For automatic cleanup
);

-- Junction table for articles in clusters
CREATE TABLE public.cluster_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2), -- How similar this article is to cluster centroid
  is_representative BOOLEAN DEFAULT false, -- Main article for the cluster
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cluster_id, article_id)
);

-- User profiles for personalization
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  location_country TEXT,
  location_city TEXT,
  location_region TEXT,
  preferred_categories TEXT[], -- Categories user is interested in
  language_preferences TEXT[] DEFAULT ARRAY['en'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User reading history for personalization
CREATE TABLE public.user_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_duration_seconds INTEGER, -- How long they spent reading
  interaction_type TEXT CHECK (interaction_type IN ('view', 'click', 'share', 'like')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User topic preferences (learned from behavior)
CREATE TABLE public.user_topic_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_keyword TEXT NOT NULL,
  preference_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1 score
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, topic_keyword)
);

-- Cached personalized feeds
CREATE TABLE public.personalized_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE CASCADE,
  personalized_score DECIMAL(5,2) NOT NULL,
  rank_position INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 minutes'),
  UNIQUE(user_id, cluster_id)
);

-- Enable RLS on all tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_feeds ENABLE ROW LEVEL SECURITY;

-- Create policies for public reading of news data
CREATE POLICY "Anyone can read news sources" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can read articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Anyone can read story clusters" ON public.story_clusters FOR SELECT USING (true);
CREATE POLICY "Anyone can read cluster articles" ON public.cluster_articles FOR SELECT USING (true);

-- Create policies for user-specific data
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view their own reading history" ON public.user_reading_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own topic preferences" ON public.user_topic_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own personalized feed" ON public.personalized_feeds
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_status ON public.articles(status) WHERE status = 'active';
CREATE INDEX idx_articles_source_id ON public.articles(source_id);
CREATE INDEX idx_articles_content_hash ON public.articles(content_hash);

CREATE INDEX idx_story_clusters_status ON public.story_clusters(status) WHERE status IN ('active', 'trending');
CREATE INDEX idx_story_clusters_base_score ON public.story_clusters(base_score DESC) WHERE status = 'active';
CREATE INDEX idx_story_clusters_expires_at ON public.story_clusters(expires_at);

CREATE INDEX idx_cluster_articles_cluster_id ON public.cluster_articles(cluster_id);
CREATE INDEX idx_cluster_articles_similarity ON public.cluster_articles(similarity_score DESC);

CREATE INDEX idx_user_reading_history_user_id ON public.user_reading_history(user_id);
CREATE INDEX idx_user_reading_history_read_at ON public.user_reading_history(read_at DESC);

CREATE INDEX idx_user_topic_preferences_user_id ON public.user_topic_preferences(user_id);
CREATE INDEX idx_user_topic_preferences_score ON public.user_topic_preferences(preference_score DESC);

CREATE INDEX idx_personalized_feeds_user_id ON public.personalized_feeds(user_id);
CREATE INDEX idx_personalized_feeds_score ON public.personalized_feeds(personalized_score DESC);
CREATE INDEX idx_personalized_feeds_expires_at ON public.personalized_feeds(expires_at);

-- Insert some default news sources with trust scores
INSERT INTO public.news_sources (name, domain, trust_score, trust_level) VALUES
('Reuters', 'reuters.com', 0.95, 'verified'),
('Associated Press', 'apnews.com', 0.95, 'verified'),
('BBC News', 'bbc.com', 0.90, 'verified'),
('The Guardian', 'theguardian.com', 0.85, 'high'),
('CNN', 'cnn.com', 0.80, 'high'),
('NPR', 'npr.org', 0.85, 'high'),
('The New York Times', 'nytimes.com', 0.85, 'high'),
('The Washington Post', 'washingtonpost.com', 0.85, 'high'),
('Times of India', 'timesofindia.indiatimes.com', 0.70, 'medium'),
('NDTV', 'ndtv.com', 0.75, 'medium'),
('India Today', 'indiatoday.in', 0.70, 'medium'),
('The Hindu', 'thehindu.com', 0.80, 'high');
