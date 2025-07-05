
-- Add missing columns to articles table for clustering
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topic_embedding vector(384),
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES story_clusters(id);

-- Create article_clusters table if it doesn't exist (using correct name from schema)
CREATE TABLE IF NOT EXISTS article_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  centroid_embedding vector(384),
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for vector similarity search on articles
CREATE INDEX IF NOT EXISTS articles_topic_embedding_idx ON articles 
USING hnsw (topic_embedding vector_cosine_ops);

-- Create index for cluster similarity search
CREATE INDEX IF NOT EXISTS article_clusters_centroid_embedding_idx ON article_clusters 
USING hnsw (centroid_embedding vector_cosine_ops);

-- Add RLS policies for new table
ALTER TABLE article_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read article clusters" 
  ON article_clusters 
  FOR SELECT 
  TO public 
  USING (true);

-- Function to update cluster centroid when articles are added/removed
CREATE OR REPLACE FUNCTION update_cluster_centroid(cluster_uuid UUID)
RETURNS void AS $$
DECLARE
  avg_embedding vector(384);
  article_count_val INTEGER;
BEGIN
  -- Calculate average embedding of all articles in cluster
  SELECT 
    AVG(topic_embedding), 
    COUNT(*)
  INTO avg_embedding, article_count_val
  FROM articles 
  WHERE cluster_id = cluster_uuid AND topic_embedding IS NOT NULL;
  
  -- Update cluster with new centroid and count
  UPDATE article_clusters 
  SET 
    centroid_embedding = avg_embedding,
    article_count = article_count_val,
    updated_at = now()
  WHERE id = cluster_uuid;
END;
$$ LANGUAGE plpgsql;

-- Database functions for clustering operations
CREATE OR REPLACE FUNCTION get_clusters_with_embeddings()
RETURNS TABLE(
  id UUID,
  name TEXT,
  centroid_embedding vector(384),
  article_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.name,
    ac.centroid_embedding,
    ac.article_count
  FROM article_clusters ac
  WHERE ac.centroid_embedding IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_article_cluster(
  cluster_name TEXT,
  cluster_description TEXT,
  centroid_data vector(384)
)
RETURNS TABLE(id UUID) AS $$
DECLARE
  new_cluster_id UUID;
BEGIN
  INSERT INTO article_clusters (name, description, centroid_embedding)
  VALUES (cluster_name, cluster_description, centroid_data)
  RETURNING article_clusters.id INTO new_cluster_id;
  
  RETURN QUERY SELECT new_cluster_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_article_features(
  article_id UUID,
  entities_data JSONB,
  keywords_data TEXT[],
  embedding_data vector(384),
  cluster_id_data UUID
)
RETURNS void AS $$
BEGIN
  UPDATE articles 
  SET 
    named_entities = entities_data,
    keywords = keywords_data,
    topic_embedding = embedding_data,
    cluster_id = cluster_id_data,
    updated_at = now()
  WHERE id = article_id;
  
  -- Update cluster centroid if cluster_id is provided
  IF cluster_id_data IS NOT NULL THEN
    PERFORM update_cluster_centroid(cluster_id_data);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_article_cluster(article_id UUID)
RETURNS TABLE(cluster_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT articles.cluster_id
  FROM articles
  WHERE articles.id = article_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_clustered_articles(
  cluster_id UUID,
  exclude_id UUID,
  article_limit INTEGER
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.author,
    a.image_url,
    a.published_at
  FROM articles a
  WHERE a.cluster_id = get_clustered_articles.cluster_id
    AND (exclude_id IS NULL OR a.id != exclude_id)
    AND a.status = 'active'
  ORDER BY a.published_at DESC
  LIMIT article_limit;
END;
$$ LANGUAGE plpgsql;
