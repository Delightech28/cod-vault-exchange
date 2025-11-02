import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, Download, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [balance] = useState(0); // Demo balance
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(false);
  };

  const handleAddFunds = () => {
    toast({
      title: 'Demo Mode',
      description: 'Payment integration is not yet configured. This is a demo.',
    });
  };

  const handleWithdraw = () => {
    toast({
      title: 'Demo Mode',
      description: 'Withdrawal functionality is not yet configured. This is a demo.',
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
              <div className="text-4xl font-bold mb-6">${balance.toFixed(2)}</div>
              <div className="flex gap-3">
                <Dialog>
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
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          min="10"
                          step="0.01"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('50')}
                        >
                          $50
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('100')}
                        >
                          $100
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount('250')}
                        >
                          $250
                        </Button>
                      </div>
                      <Button onClick={handleAddFunds} className="w-full">
                        Continue to Payment
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Minimum deposit: $10.00
                      </p>
                    </div>
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
                          Available: ${balance.toFixed(2)}
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
