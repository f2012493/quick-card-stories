-- Add TLDR column to articles and backfill with 60-word summaries
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS tldr TEXT;

-- Backfill TLDR for existing rows (only where missing)
WITH base AS (
  SELECT 
    id,
    trim(regexp_replace(
      array_to_string( (regexp_split_to_array(coalesce(content, description, title, ''), E'\\s+'))[1:60], ' ' ),
      E'\\s+', ' ', 'g'
    )) AS summary
  FROM public.articles
)
UPDATE public.articles a
SET tldr = CASE
  WHEN b.summary IS NULL OR b.summary = '' THEN 'Summary not available'
  WHEN b.summary ~ '[.!?]$' THEN b.summary
  ELSE b.summary || '.'
END
FROM base b
WHERE a.id = b.id AND (a.tldr IS NULL OR a.tldr = '');