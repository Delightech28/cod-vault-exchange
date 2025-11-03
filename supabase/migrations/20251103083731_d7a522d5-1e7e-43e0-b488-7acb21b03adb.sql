-- Add unique constraint back on phone_number
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_number_key UNIQUE (phone_number);

-- Add a comment to document that phone numbers must be unique
COMMENT ON COLUMN public.profiles.phone_number IS 'Phone number - must be unique per user';