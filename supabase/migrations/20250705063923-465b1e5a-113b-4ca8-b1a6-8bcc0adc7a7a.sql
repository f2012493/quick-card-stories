
-- Add columns for NER and clustering to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topic_embedding vector(384),
ADD COLUMN IF NOT EXISTS cluster_id UUID;

-- Create clusters table for dynamic clustering
CREATE TABLE IF NOT EXISTS article_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  centroid_embedding vector(384),
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS articles_topic_embedding_idx ON articles 
USING hnsw (topic_embedding vector_cosine_ops);

-- Create index for cluster similarity search
CREATE INDEX IF NOT EXISTS article_clusters_centroid_embedding_idx ON article_clusters 
USING hnsw (centroid_embedding vector_cosine_ops);

-- Add RLS policies for new tables
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

-- Trigger to update cluster centroid when articles change
CREATE OR REPLACE FUNCTION trigger_update_cluster_centroid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old cluster if article was moved
  IF OLD.cluster_id IS NOT NULL AND OLD.cluster_id != NEW.cluster_id THEN
    PERFORM update_cluster_centroid(OLD.cluster_id);
  END IF;
  
  -- Update new cluster
  IF NEW.cluster_id IS NOT NULL THEN
    PERFORM update_cluster_centroid(NEW.cluster_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_cluster_centroid_trigger
  AFTER UPDATE OF cluster_id ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_cluster_centroid();
