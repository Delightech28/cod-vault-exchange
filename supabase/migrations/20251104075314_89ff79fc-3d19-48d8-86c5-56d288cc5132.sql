-- Create email verification codes table
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification codes
CREATE POLICY "Users can view their own verification codes"
ON public.email_verification_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own verification codes
CREATE POLICY "Users can insert their own verification codes"
ON public.email_verification_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification codes
CREATE POLICY "Users can update their own verification codes"
ON public.email_verification_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX idx_verification_codes_expires_at ON public.email_verification_codes(expires_at);