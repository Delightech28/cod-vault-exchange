-- Drop the existing foreign key that points to auth.users
ALTER TABLE public.listings
DROP CONSTRAINT listings_seller_id_fkey;

-- Add new foreign key that points to profiles.user_id
ALTER TABLE public.listings
ADD CONSTRAINT listings_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Also update verified_by to point to profiles instead of auth.users
ALTER TABLE public.listings
DROP CONSTRAINT listings_verified_by_fkey;

ALTER TABLE public.listings
ADD CONSTRAINT listings_verified_by_fkey 
FOREIGN KEY (verified_by) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;