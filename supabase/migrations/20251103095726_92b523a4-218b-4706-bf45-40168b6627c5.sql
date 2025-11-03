-- Public profile fetch function for safe cross-user reads
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (display_name text, full_name text, username text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name, full_name, username
  FROM public.profiles
  WHERE user_id = p_user_id
$$;