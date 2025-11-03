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

interface Bank {
  name: string;
  code: string;
}

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadBanks();
    
    // Check if user returned from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      // Verify payment with backend
      verifyPayment(reference);
    } else if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your wallet will be credited shortly.",
      });
      window.history.replaceState({}, '', '/wallet');
      setTimeout(() => checkAuth(), 2000);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No charges were made.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/wallet');
    }
  }, []);

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-banks');
      
      if (error) throw error;
      
      if (data?.status && data?.data) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const verifyAccount = async (accountNum: string, bankCd: string) => {
    if (accountNum.length !== 10 || !bankCd) return;

    try {
      setVerifyingAccount(true);
      setAccountName('');

      const { data, error } = await supabase.functions.invoke('resolve-account', {
        body: {
          account_number: accountNum,
          bank_code: bankCd,
        },
      });

      if (error) throw error;

      if (data?.status && data?.account_name) {
        setAccountName(data.account_name);
        toast({
          title: "Account Verified",
          description: `✅ ${data.account_name}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data?.message || "Cannot resolve account details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Account verification error:', error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify account",
        variant: "destructive",
      });
    } finally {
      setVerifyingAccount(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-payment?reference=${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          }
        }
      );

      const data = await response.json();

      if (data.verified) {
        toast({
          title: "Payment Verified",
          description: `₦${data.amount.toFixed(2)} has been added to your wallet.`,
        });
        // Refresh balance
        checkAuth();
      } else {
        toast({
          title: "Payment Pending",
          description: "Your payment is being processed. Balance will update shortly.",
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Processing",
        description: "Your wallet will be credited shortly.",
      });
    } finally {
      // Clean up URL
      window.history.replaceState({}, '', '/wallet');
    }
  };

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

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const platformFee = 50;
    const totalDeduction = amount + platformFee;

    if (!withdrawAmount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (!bankCode || !accountNumber) {
      toast({
        title: "Missing Bank Details",
        description: "Please enter your bank code and account number.",
        variant: "destructive",
      });
      return;
    }

    if (balance < totalDeduction) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${totalDeduction.toFixed(2)} (₦${amount} + ₦${platformFee} fee) but have ₦${balance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setWithdrawing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to withdraw funds.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('withdraw-wallet', {
        body: {
          amount,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Withdrawal Initiated",
        description: `₦${amount.toFixed(2)} withdrawal is being processed. Funds will arrive shortly.`,
      });

      // Reset form and close dialog
      setWithdrawAmount('');
      setBankCode('');
      setAccountNumber('');
      setAccountName('');
      setShowWithdraw(false);

      // Refresh balance
      setTimeout(() => checkAuth(), 1000);

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
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
              <div className="text-4xl font-bold mb-6">
                ₦{balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
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

                <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
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
                        Transfer funds from your wallet to your Nigerian bank account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Amount (NGN)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          min="100"
                          step="10"
                          disabled={withdrawing}
                        />
                        <p className="text-xs text-muted-foreground">
                          Available: ₦{balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bank-code">Select Bank</Label>
                        <select
                          id="bank-code"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={bankCode}
                          onChange={(e) => {
                            setBankCode(e.target.value);
                            setAccountName('');
                            if (accountNumber.length === 10) {
                              verifyAccount(accountNumber, e.target.value);
                            }
                          }}
                          disabled={withdrawing || verifyingAccount}
                        >
                          <option value="">-- Select Bank --</option>
                          {banks.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          type="text"
                          placeholder="0123456789"
                          value={accountNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setAccountNumber(value);
                            setAccountName('');
                            if (value.length === 10 && bankCode) {
                              verifyAccount(value, bankCode);
                            }
                          }}
                          maxLength={10}
                          disabled={withdrawing || verifyingAccount}
                        />
                        {verifyingAccount && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Verifying account...
                          </p>
                        )}
                        {accountName && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <span>✅</span>
                            <span className="font-medium">{accountName}</span>
                          </p>
                        )}
                      </div>

                      {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                        <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Withdrawal amount:</span>
                            <span className="font-medium">₦{parseFloat(withdrawAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform fee:</span>
                            <span className="font-medium">₦50.00</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="font-semibold">Total deduction:</span>
                            <span className="font-semibold">₦{(parseFloat(withdrawAmount) + 50).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => setShowWithdraw(false)} 
                        variant="outline" 
                        disabled={withdrawing}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleWithdraw} 
                        disabled={withdrawing || balance === 0 || !withdrawAmount || !bankCode || !accountNumber || !accountName || verifyingAccount}
                      >
                        {withdrawing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Confirm Withdrawal'
                        )}
                      </Button>
                    </DialogFooter>
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
                <p>• Minimum withdrawal: ₦100</p>
                <p>• No fees for adding funds</p>
                <p>• ₦50 platform fee per withdrawal</p>
                <p>• Withdrawals process within minutes</p>
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
