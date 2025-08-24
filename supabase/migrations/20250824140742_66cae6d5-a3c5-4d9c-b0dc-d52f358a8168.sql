-- Fix security vulnerability: Remove public access to sensitive ad revenue data
-- Drop the existing public SELECT policy that exposes sensitive business data
DROP POLICY IF EXISTS "Anyone can view active ad units" ON public.ad_units;

-- Create a secure policy that only allows authenticated admin users to view full ad unit data
CREATE POLICY "Authenticated admins can view ad units" ON public.ad_units
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND subscription_status = 'admin'
    )
  );

-- Create a secure function for public ad display data (without sensitive pricing info)
CREATE OR REPLACE FUNCTION public.get_public_ad_display_data()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  category text,
  is_active boolean
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ad_units.id,
    ad_units.title,
    ad_units.description,
    ad_units.category,
    ad_units.is_active
  FROM public.ad_units
  WHERE ad_units.is_active = true;
$$;

-- Grant execute permission to anonymous users for the public function
GRANT EXECUTE ON FUNCTION public.get_public_ad_display_data() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_ad_display_data() TO authenticated;