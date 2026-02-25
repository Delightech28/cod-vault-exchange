import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, Wallet, TrendingUp, ArrowLeft } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

type OnboardingStep = 'profile' | 'email-verify' | 'verify-otp' | 'account-type' | 'kyc' | 'tour';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  // Form data
  const [username, setUsername] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [country, setCountry] = useState('');
  const [countryDialCode, setCountryDialCode] = useState('');
  const [otp, setOtp] = useState('');
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [userEmail, setUserEmail] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    setUserEmail(user.email || '');

    // Check if onboarding already completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, email_verified, username, account_type, country')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      navigate('/dashboard');
      return;
    }

    if (profile) {
      // Restore form data if available
      if (profile.username) setUsername(profile.username);
      if (profile.country) setCountry(profile.country);
      if (profile.account_type) setAccountType(profile.account_type);

      // Determine the current step
      if (!profile.username || !profile.country) {
        setStep('profile');
      } else if (!profile.email_verified) {
        // Check if a code was already sent
        const { data: recentCode } = await supabase
          .from('email_verification_codes')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('verified', false)
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentCode && new Date(recentCode.expires_at) > new Date()) {
          setStep('verify-otp');
        } else {
          setStep('email-verify');
        }
      } else if (!profile.account_type) {
        setStep('account-type');
      } else {
        // If they have account type, they moved past it
        if (profile.account_type === 'seller' || profile.account_type === 'both') {
          setStep('kyc');
        } else {
          setStep('tour');
        }
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        timezone,
        country,
      })
      .eq('user_id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setStep('email-verify');
  };

  const handleEmailVerify = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: userEmail, userId: userId }
      });

      if (error) throw error;

      toast({
        title: 'Code sent!',
        description: `We sent a 6-digit verification code to ${userEmail}`,
      });

      setCanResend(false);
      setResendTimer(60);

      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setStep('verify-otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Verify the OTP code
      const { data: verificationData, error: verifyError } = await supabase
        .from('email_verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', otp)
        .eq('verified', false)
        .maybeSingle();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        toast({
          title: 'Error',
          description: 'Failed to verify code. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!verificationData) {
        toast({
          title: 'Invalid code',
          description: 'The verification code you entered is incorrect.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if code has expired
      const expiresAt = new Date(verificationData.expires_at);
      if (expiresAt < new Date()) {
        toast({
          title: 'Code expired',
          description: 'This verification code has expired. Please request a new one.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Mark code as verified
      await supabase
        .from('email_verification_codes')
        .update({ verified: true })
        .eq('id', verificationData.id);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
        })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Email verified!',
        description: 'Your email has been verified successfully.',
      });

      setStep('account-type');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeSubmit = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        account_type: accountType,
      })
      .eq('user_id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (accountType === 'seller' || accountType === 'both') {
      setStep('kyc');
    } else {
      setStep('tour');
    }
  };

  const skipKYC = () => {
    setStep('tour');
  };

  const handleTourComplete = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        tour_completed: true,
      })
      .eq('user_id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    navigate('/dashboard');
  };

  const stepNumber = {
    'profile': 1,
    'email-verify': 2,
    'verify-otp': 2,
    'account-type': 3,
    'kyc': 4,
    'tour': 5,
  }[step];

  const progress = (stepNumber / 5) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Step {stepNumber} of 5
          </p>
        </div>

        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>
                Tell us a bit about yourself to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={country}
                    onChange={(countryValue, timezoneValue, dialCode) => {
                      setCountry(countryValue);
                      setTimezone(timezoneValue);
                      setCountryDialCode(dialCode);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    readOnly
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'email-verify' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>
                We'll send a verification code to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <Button onClick={handleEmailVerify} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Code
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'verify-otp' && (
          <Card>
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('email-verify')}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {userEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
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
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleOtpVerify}
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Code
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleEmailVerify}
                  disabled={loading || !canResend}
                >
                  {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'account-type' && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Account Type</CardTitle>
              <CardDescription>
                You can change this later in settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <button
                  onClick={() => setAccountType('buyer')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${accountType === 'buyer' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <Wallet className="h-6 w-6 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Buyer</h3>
                      <p className="text-sm text-muted-foreground">
                        Purchase game accounts with secure escrow protection
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setAccountType('seller')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${accountType === 'seller' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <TrendingUp className="h-6 w-6 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Seller</h3>
                      <p className="text-sm text-muted-foreground">
                        List and sell your game accounts with verification badges
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setAccountType('both')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${accountType === 'both' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <Shield className="h-6 w-6 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Both</h3>
                      <p className="text-sm text-muted-foreground">
                        Buy and sell accounts on the marketplace
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <Button onClick={handleAccountTypeSubmit} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'kyc' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Identity</CardTitle>
              <CardDescription>
                Get higher limits and earn trust with buyers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Why verify?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>• Verified seller badge on your profile</li>
                  <li>• Higher transaction limits</li>
                  <li>• Increased buyer trust</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  Start Verification
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={skipKYC}
                  disabled={loading}
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'tour' && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Marketplace!</CardTitle>
              <CardDescription>
                Here's what you need to know to stay safe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until you confirm delivery. Funds are only released when you click "Deal Accepted".
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Platform Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      Add funds to your wallet for instant purchases. Withdraw anytime with verified payout methods.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Transfers</h4>
                    <p className="text-sm text-muted-foreground">
                      Never share credentials publicly. Use our secure delivery system and verify everything before accepting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-1">Safety Reminder</p>
                <p className="text-xs text-muted-foreground">
                  Always verify account details before clicking "Deal Accepted". If something seems wrong, open a dispute. Our team reviews all disputes within 72 hours.
                </p>
              </div>

              <Button onClick={handleTourComplete} className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
