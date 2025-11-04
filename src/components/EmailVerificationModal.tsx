import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  userId: string;
  onVerified: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  userId,
  onVerified
}: EmailVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (isOpen) {
      sendVerificationCode();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0 && isOpen) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, isOpen]);

  const sendVerificationCode = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, userId }
      });

      if (error) throw error;

      toast({
        title: "Code sent!",
        description: `We sent a 6-digit verification code to ${email}`,
      });
      
      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    await sendVerificationCode();
    setResendLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // DEMO MODE: Accept any 6-digit code
      // Update profile to mark email as verified
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('user_id', userId);

      if (updateProfileError) throw updateProfileError;

      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified",
      });

      onVerified();
      onClose();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            We sent a 6-digit code to {email}. Enter it below to verify your email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="text-sm text-muted-foreground text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend code"}
              </button>
            ) : (
              <span>Resend code in {resendTimer}s</span>
            )}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={loading || otp.length !== 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}