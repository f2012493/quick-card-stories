-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update user_profiles subscription_status to use new role system
-- First, migrate existing admin users from user_profiles
DO $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::app_role
  FROM public.user_profiles 
  WHERE subscription_status = 'admin'
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Fix existing database functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_subscription_status(user_id uuid, status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.user_profiles 
  SET 
    subscription_status = status,
    subscribed_at = CASE WHEN status = 'subscribed' THEN NOW() ELSE subscribed_at END,
    updated_at = NOW()
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_consumption()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.user_profiles 
  SET 
    articles_consumed_today = 0,
    last_consumption_reset = CURRENT_DATE
  WHERE last_consumption_reset < CURRENT_DATE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_trust_score(article_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  trust_votes INTEGER;
  total_votes INTEGER;
  trust_ratio NUMERIC;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE trust_vote = true),
    COUNT(*)
  INTO trust_votes, total_votes
  FROM public.trust_scores 
  WHERE article_id = article_uuid;
  
  IF total_votes = 0 THEN
    RETURN 0.5; -- neutral score for no votes
  END IF;
  
  trust_ratio := trust_votes::NUMERIC / total_votes::NUMERIC;
  
  -- Update the article's trust score
  UPDATE public.articles 
  SET trust_score = trust_ratio
  WHERE id = article_uuid;
  
  RETURN trust_ratio;
END;
$function$;