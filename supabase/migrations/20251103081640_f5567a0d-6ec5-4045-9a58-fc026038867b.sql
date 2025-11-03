-- Create wallet balance tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0;

-- Create messages table for in-transaction chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  is_system_message boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Transaction participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE transactions.id = messages.transaction_id
    AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
  )
  OR is_admin_or_moderator(auth.uid())
);

CREATE POLICY "Transaction participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE transactions.id = messages.transaction_id
    AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
  )
  AND sender_id = auth.uid()
);

-- Notifications policies
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add acceptance deadline to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS acceptance_deadline timestamp with time zone;

-- Update existing transactions to set acceptance deadline
UPDATE public.transactions 
SET acceptance_deadline = delivered_at + INTERVAL '48 hours'
WHERE status = 'delivered' AND acceptance_deadline IS NULL;