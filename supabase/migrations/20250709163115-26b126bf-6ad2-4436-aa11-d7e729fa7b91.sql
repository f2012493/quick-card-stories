
-- Add missing fields to user_profiles table for subscription functionality
ALTER TABLE public.user_profiles 
ADD COLUMN phone_number text,
ADD COLUMN subscription_status text DEFAULT 'free',
ADD COLUMN subscribed_at timestamp with time zone;

-- Add an index for subscription status queries
CREATE INDEX idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
