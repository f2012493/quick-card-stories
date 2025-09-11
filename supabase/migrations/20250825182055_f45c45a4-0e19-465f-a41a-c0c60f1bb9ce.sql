-- Fix remaining function search paths that weren't updated in the previous migration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, phone_number)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$function$;

-- Reduce OTP expiry from 1 hour to 10 minutes for better security
-- Note: This affects the auth.otp_expiry_seconds setting
-- This requires updating the auth configuration which should be done through the Supabase dashboard