-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Transaction participants can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE id = transaction_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    AND status = 'completed'
  )
);

CREATE POLICY "Reviewers can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = reviewer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_reviews_reviewed_user ON public.reviews(reviewed_user_id);
CREATE INDEX idx_reviews_transaction ON public.reviews(transaction_id);

-- Add review stats to profiles (denormalized for performance)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;

-- Function to update profile review stats
CREATE OR REPLACE FUNCTION public.update_profile_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    review_count = (
      SELECT COUNT(*) FROM public.reviews WHERE reviewed_user_id = NEW.reviewed_user_id
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE reviewed_user_id = NEW.reviewed_user_id
    )
  WHERE user_id = NEW.reviewed_user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update review stats
CREATE TRIGGER update_review_stats_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_review_stats();

CREATE TRIGGER update_review_stats_on_update
AFTER UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_review_stats();