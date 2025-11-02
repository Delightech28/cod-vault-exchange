-- Add account type enum
CREATE TYPE public.account_type AS ENUM ('buyer', 'seller', 'both');

-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE,
ADD COLUMN display_name text,
ADD COLUMN timezone text,
ADD COLUMN country text,
ADD COLUMN account_type account_type,
ADD COLUMN onboarding_completed boolean DEFAULT false,
ADD COLUMN phone_verified_at timestamp with time zone,
ADD COLUMN tour_completed boolean DEFAULT false;

-- Add index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update the handle_new_user function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();