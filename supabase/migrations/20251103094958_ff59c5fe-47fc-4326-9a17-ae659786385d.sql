-- Add read tracking to messages table
ALTER TABLE public.messages 
ADD COLUMN read_by uuid[] DEFAULT '{}';

-- Add index for better performance on read tracking
CREATE INDEX idx_messages_read_by ON public.messages USING GIN(read_by);

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_transaction_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE transaction_id = p_transaction_id
    AND sender_id != p_user_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$;