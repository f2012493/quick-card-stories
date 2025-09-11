
-- Step 1: Clean up unused tables that are cluttering the database
DROP TABLE IF EXISTS video_content CASCADE;
DROP TABLE IF EXISTS content_summaries CASCADE;
DROP TABLE IF EXISTS story_cards CASCADE;
DROP TABLE IF EXISTS story_templates CASCADE;
DROP TABLE IF EXISTS ad_placements CASCADE;
DROP TABLE IF EXISTS personalized_feeds CASCADE;
DROP TABLE IF EXISTS user_reading_history CASCADE;
DROP TABLE IF EXISTS user_topic_preferences CASCADE;
DROP TABLE IF EXISTS trust_scores CASCADE;

-- Step 2: Ensure cluster_articles table has proper foreign key constraints
-- (This table is needed for clustering functionality)
ALTER TABLE cluster_articles 
ADD CONSTRAINT fk_cluster_articles_cluster_id 
FOREIGN KEY (cluster_id) REFERENCES story_clusters(id) ON DELETE CASCADE;

ALTER TABLE cluster_articles 
ADD CONSTRAINT fk_cluster_articles_article_id 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- Step 3: Ensure story_analysis table has proper foreign key constraint
ALTER TABLE story_analysis 
ADD CONSTRAINT fk_story_analysis_article_id 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- Step 4: Add missing foreign key constraint for articles table
ALTER TABLE articles 
ADD CONSTRAINT fk_articles_source_id 
FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE SET NULL;
