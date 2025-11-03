-- Create a function to safely increment wallet balance
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the wallet balance for the user
  -- This is atomic and transaction-safe
  UPDATE public.profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
  WHERE user_id = p_user_id;
  
  -- If no rows were updated, the user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;
END;
$$;