-- Add kd_ratio, playtime, and total_wins columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS kd_ratio text,
ADD COLUMN IF NOT EXISTS playtime text,
ADD COLUMN IF NOT EXISTS total_wins text;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$;