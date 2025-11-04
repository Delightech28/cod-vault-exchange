-- Allow sellers to delete their own listings (only draft and rejected)
CREATE POLICY "Sellers can delete their own draft/rejected listings"
ON public.listings
FOR DELETE
USING (
  auth.uid() = seller_id 
  AND status IN ('draft', 'rejected')
);