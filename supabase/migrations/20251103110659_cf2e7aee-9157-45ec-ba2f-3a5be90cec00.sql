-- Create storage bucket for transaction message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-attachments', 'transaction-attachments', false);

-- Policy: Users can upload attachments to their transactions
CREATE POLICY "Users can upload to their transactions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Transaction participants can view attachments
CREATE POLICY "Transaction participants can view attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'transaction-attachments'
  AND (
    -- Check if user is part of the transaction
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
      AND (storage.foldername(name))[2] = t.id::text
    )
    OR is_admin_or_moderator(auth.uid())
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'transaction-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);