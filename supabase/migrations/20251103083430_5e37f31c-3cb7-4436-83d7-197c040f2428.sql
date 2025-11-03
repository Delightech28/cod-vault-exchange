-- Drop unique constraint on phone_number if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_number_key;

-- Add a comment to document that phone numbers can be shared
COMMENT ON COLUMN public.profiles.phone_number IS 'Phone number - can be shared by multiple users';