import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export function ReviewModal({
  open,
  onOpenChange,
  transactionId,
  reviewedUserId,
  reviewedUserName,
  existingReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to leave a review.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id);

        if (error) throw error;

        toast({
          title: 'Review updated',
          description: 'Your review has been updated successfully.',
        });
      } else {
        // Create new review
        const { error } = await supabase.from('reviews').insert({
          transaction_id: transactionId,
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          rating,
          comment: comment.trim() || null,
        });

        if (error) throw error;

        toast({
          title: 'Review submitted',
          description: 'Thank you for your feedback!',
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Edit Review' : 'Leave a Review'}
          </DialogTitle>
          <DialogDescription>
            Rate your experience with {reviewedUserName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Your Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment (optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : existingReview ? 'Update' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
