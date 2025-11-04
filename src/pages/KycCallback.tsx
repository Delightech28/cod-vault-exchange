import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function KycCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const kycStatus = searchParams.get('kyc');

      // Handle direct kyc=success parameter (if HP redirects with this)
      if (kycStatus === 'success') {
        toast({
          title: 'Verification Complete',
          description: "✅ You're now verified and can start listing accounts.",
        });
        setProcessing(false);
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      if (!sessionId) {
        toast({
          title: 'Error',
          description: 'Invalid verification callback',
          variant: 'destructive',
        });
        setProcessing(false);
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: 'Error',
            description: 'You must be logged in',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        // Call the callback edge function to verify status
        const { data, error } = await supabase.functions.invoke('hp-kyc-callback', {
          body: { session_id: sessionId, user_id: user.id },
        });

        if (error) {
          console.error('Callback error:', error);
          toast({
            title: 'Verification Error',
            description: 'Failed to process verification. Please try again.',
            variant: 'destructive',
          });
          setProcessing(false);
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }

        if (data?.success && data?.status === 'verified') {
          toast({
            title: 'Verification Complete',
            description: "✅ You're now verified and can start listing accounts.",
          });
        } else {
          toast({
            title: 'Verification Incomplete',
            description: `Verification status: ${data?.status || 'unknown'}`,
            variant: 'destructive',
          });
        }

        setProcessing(false);
        setTimeout(() => navigate('/profile'), 2000);

      } catch (error) {
        console.error('Error processing callback:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        setProcessing(false);
        setTimeout(() => navigate('/profile'), 2000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Processing Verification</h2>
        <p className="text-muted-foreground">
          {processing ? 'Please wait while we verify your identity...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
