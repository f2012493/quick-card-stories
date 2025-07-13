
-- Modify the video_content table to use TEXT instead of UUID for article_id
-- since we're working with mock data that uses string IDs like "bs-1752385339852-3"

-- First, drop the existing foreign key constraint
ALTER TABLE public.video_content 
DROP CONSTRAINT IF EXISTS video_content_article_id_fkey;

-- Then modify the column type
ALTER TABLE public.video_content 
ALTER COLUMN article_id TYPE TEXT;

-- Update any existing records to ensure compatibility
UPDATE public.video_content 
SET processing_status = 'completed' 
WHERE processing_status IS NULL;
