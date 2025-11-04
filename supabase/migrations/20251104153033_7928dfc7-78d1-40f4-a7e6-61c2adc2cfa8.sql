-- Add is_available field to listings table
ALTER TABLE public.listings 
ADD COLUMN is_available boolean DEFAULT true;

-- Allow sellers to update their own approved listings (for marking as sold/editing price)
CREATE POLICY "Sellers can update their own approved listings"
ON public.listings
FOR UPDATE
USING (
  auth.uid() = seller_id 
  AND status = 'approved'
);