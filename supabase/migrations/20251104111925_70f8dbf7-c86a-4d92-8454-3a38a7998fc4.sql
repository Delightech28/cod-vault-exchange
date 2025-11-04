-- Allow anyone to view public profile information for marketplace listings
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
USING (true);