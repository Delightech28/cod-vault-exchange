-- Add type and platform_fee columns to wallet_transactions
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'deposit',
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0;

-- Create user_bank_accounts table
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_bank_accounts
CREATE POLICY "Users can view their own bank accounts"
ON public.user_bank_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
ON public.user_bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts"
ON public.user_bank_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
ON public.user_bank_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_bank_accounts_updated_at
BEFORE UPDATE ON public.user_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create platform_fees table for tracking
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  amount numeric NOT NULL,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- RLS policy for platform_fees (only admins can view)
CREATE POLICY "Admins can view platform fees"
ON public.platform_fees
FOR SELECT
USING (is_admin_or_moderator(auth.uid()));