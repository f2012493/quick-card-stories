
-- Remove unused clustering and user profile tables
DROP TABLE IF EXISTS cluster_articles CASCADE;
DROP TABLE IF EXISTS story_clusters CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS article_clusters CASCADE;

-- Remove any remaining triggers or functions related to these tables
DROP FUNCTION IF EXISTS update_cluster_centroid(UUID);
DROP FUNCTION IF EXISTS trigger_update_cluster_centroid();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_daily_consumption();
DROP FUNCTION IF EXISTS calculate_trust_score(UUID);

-- Remove clustering-related functions
DROP FUNCTION IF EXISTS get_clusters_with_embeddings();
DROP FUNCTION IF EXISTS create_article_cluster(TEXT, TEXT, vector(384));
DROP FUNCTION IF EXISTS update_article_features(UUID, JSONB, TEXT[], vector(384), UUID);
DROP FUNCTION IF EXISTS get_article_cluster(UUID);
DROP FUNCTION IF EXISTS get_clustered_articles(UUID, UUID, INTEGER);

-- Remove clustering-related columns from articles table
ALTER TABLE articles DROP COLUMN IF EXISTS named_entities;
ALTER TABLE articles DROP COLUMN IF EXISTS keywords;
ALTER TABLE articles DROP COLUMN IF EXISTS topic_embedding;
ALTER TABLE articles DROP COLUMN IF EXISTS cluster_id;

-- Remove trust_score column as it's no longer needed
ALTER TABLE articles DROP COLUMN IF EXISTS trust_score;

-- Remove local_relevance_score as it's clustering-related
ALTER TABLE articles DROP COLUMN IF EXISTS local_relevance_score;
