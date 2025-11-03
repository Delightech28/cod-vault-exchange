import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, Download, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    // Check if user returned from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your wallet will be credited shortly.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/wallet');
      // Refresh balance
      setTimeout(() => {
        checkAuth();
      }, 2000);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No charges were made.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/wallet');
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch wallet balance and country
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, country')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setBalance(Number(profile.wallet_balance) || 0);
      setUserCountry(profile.country);
    }

    setLoading(false);
  };

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const amount = parseFloat(addAmount);
      // Always use NGN for Paystack (primary supported currency)
      const currency = 'NGN';

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add funds.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('initialize-payment', {
        body: {
          amount,
          currency,
          provider: 'paystack'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to initialize payment');
      }

      const { authorization_url, reference } = response.data;

      if (authorization_url) {
        // Open Paystack checkout in same window for better cancel handling
        window.location.href = authorization_url;
      }
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    toast({
      title: "Coming Soon",
      description: "Withdrawal functionality will be available soon.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds for instant purchases</p>
        </div>

        <div className="grid gap-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <WalletIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Available Balance</span>
                </div>
              </div>
              <div className="text-4xl font-bold mb-6">{formatPrice(balance, userCountry)}</div>
              <div className="flex gap-3">
                <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Funds to Wallet</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to add to your wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (NGN)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          min="50"
                          step="10"
                          disabled={loading}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('50')}
                          disabled={loading}
                        >
                          ₦50
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('100')}
                          disabled={loading}
                        >
                          ₦100
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('500')}
                          disabled={loading}
                        >
                          ₦500
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Minimum deposit: ₦50
                      </p>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setShowAddFunds(false)} variant="outline" disabled={loading}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFunds} disabled={loading || !addAmount || parseFloat(addAmount) <= 0}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Continue to Payment'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                      <DialogDescription>
                        Transfer funds from your wallet to your bank account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          max={balance}
                          step="0.01"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available: {formatPrice(balance, userCountry)}
                        </p>
                      </div>
                      <Button onClick={handleWithdraw} className="w-full" disabled={balance === 0}>
                        Request Withdrawal
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Withdrawals typically process within 2-5 business days
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why Use Wallet?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Instant purchases without entering payment details</p>
                <p>• Lower transaction fees</p>
                <p>• Faster checkout process</p>
                <p>• Secure fund management</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Funds are held securely in your wallet</p>
                <p>• Minimum withdrawal: $10.00</p>
                <p>• No fees for adding funds</p>
                <p>• Small withdrawal fee may apply</p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View your wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="deposits">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <WalletIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Your transaction history will appear here</p>
                  </div>
                </TabsContent>
                <TabsContent value="deposits">
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No deposits yet</p>
                  </div>
                </TabsContent>
                <TabsContent value="withdrawals">
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No withdrawals yet</p>
                  </div>
                </TabsContent>
                <TabsContent value="purchases">
                  <div className="text-center py-12 text-muted-foreground">
                    <WalletIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No purchases yet</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
