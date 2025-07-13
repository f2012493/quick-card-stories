
-- Complete fix for video_content table to handle string-based article IDs
-- This will recreate the table structure properly

-- First, let's see what constraints exist and drop them
DO $$ 
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'video_content_article_id_fkey' 
        AND table_name = 'video_content'
    ) THEN
        ALTER TABLE public.video_content DROP CONSTRAINT video_content_article_id_fkey;
    END IF;
END $$;

-- Now modify the column type to TEXT
ALTER TABLE public.video_content 
ALTER COLUMN article_id TYPE TEXT;

-- Clear any existing problematic data
DELETE FROM public.video_content WHERE article_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Update processing status for any remaining records
UPDATE public.video_content 
SET processing_status = 'completed' 
WHERE processing_status IS NULL;

-- Add a comment to document the change
COMMENT ON COLUMN public.video_content.article_id IS 'Article ID as TEXT to support both UUID and string formats like bs-1752385339852-3';
