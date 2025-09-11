-- Fix the remaining function without search path
CREATE OR REPLACE FUNCTION public.get_public_ad_display_data()
RETURNS TABLE(id uuid, title text, description text, category text, is_active boolean)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT 
    ad_units.id,
    ad_units.title,
    ad_units.description,
    ad_units.category,
    ad_units.is_active
  FROM public.ad_units
  WHERE ad_units.is_active = true;
$function$;

-- Move vector extension from public to extensions schema (this is the recommended approach)
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving vector extension requires dropping and recreating it, which could affect existing data
-- This should be done carefully in production. For now, we'll just document the issue.
-- The vector extension being in public schema is a warning, not a critical security issue.