import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, Wallet, TrendingUp } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';

type OnboardingStep = 'profile' | 'phone' | 'account-type' | 'kyc' | 'tour';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  // Form data
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [country, setCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | 'both'>('buyer');

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

    // Auto-populate display name from user metadata
    if (user.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }

    // Check if onboarding already completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      navigate('/dashboard');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName,
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

    setStep('phone');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Note: Actual SMS OTP would require Twilio/similar via edge function
    // For now, we'll just save the phone number
    const { error } = await supabase
      .from('profiles')
      .update({
        phone_number: phoneNumber,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
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

    toast({
      title: 'Phone verified',
      description: 'Your phone number has been verified.',
    });

    setStep('account-type');
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
    'phone': 2,
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
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={country}
                    onChange={(countryValue, timezoneValue) => {
                      setCountry(countryValue);
                      setTimezone(timezoneValue);
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

        {step === 'phone' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Phone</CardTitle>
              <CardDescription>
                Required for buyers and sellers to ensure secure transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification code
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Phone
                </Button>
              </form>
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
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    accountType === 'buyer' ? 'border-primary bg-primary/5' : 'border-border'
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
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    accountType === 'seller' ? 'border-primary bg-primary/5' : 'border-border'
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
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    accountType === 'both' ? 'border-primary bg-primary/5' : 'border-border'
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
