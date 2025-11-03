import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
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

    setCurrentUser(user);
    await fetchTransactions(user.id);
    setLoading(false);
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          listings (
            id,
            title,
            game_name,
            price
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleMarkDelivered = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Marked as delivered');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await fetchTransactions(user.id);
    } catch (error) {
      console.error('Error marking delivered:', error);
      toast.error('Failed to mark as delivered');
    }
  };

  const handleConfirmDelivery = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          delivery_confirmed_at: new Date().toISOString(),
          funds_released_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Payment released to seller');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await fetchTransactions(user.id);
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'Pending Payment', variant: 'secondary', icon: Clock },
      escrow_held: { label: 'In Escrow', variant: 'default', icon: Package },
      delivered: { label: 'Delivered', variant: 'default', icon: Package },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
      disputed: { label: 'Disputed', variant: 'destructive', icon: AlertCircle },
      cancelled: { label: 'Cancelled', variant: 'secondary', icon: AlertCircle },
      refunded: { label: 'Refunded', variant: 'secondary', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredTransactions = async () => {
    if (!currentUser) return [];

    if (activeTab === 'buying') {
      return transactions.filter(t => t.buyer_id === currentUser.id);
    } else if (activeTab === 'selling') {
      return transactions.filter(t => t.seller_id === currentUser.id);
    }
    return transactions;
  };

  const [displayTransactions, setDisplayTransactions] = useState<any[]>([]);

  useEffect(() => {
    const updateDisplay = async () => {
      const filtered = await filteredTransactions();
      setDisplayTransactions(filtered);
    };
    updateDisplay();
  }, [transactions, activeTab, currentUser]);

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
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage your buying and selling activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your purchases and sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="buying">Buying</TabsTrigger>
                <TabsTrigger value="selling">Selling</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {displayTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">No transactions yet</p>
                    <p className="text-sm">Your transactions will appear here once you start buying or selling</p>
                  </div>
                ) : (
                  displayTransactions.map((transaction) => {
                    const isBuyer = transaction.buyer_id === currentUser?.id;
                    const isSeller = transaction.seller_id === currentUser?.id;

                    return (
                      <Card key={transaction.id} className="bg-card border-border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg">
                                  {transaction.listings?.title || 'Account'}
                                </h3>
                                {getStatusBadge(transaction.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {transaction.listings?.game_name || 'Game'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-accent">
                                ${transaction.amount}
                              </div>
                              <Badge variant="secondary" className="mt-1">
                                {isBuyer ? 'Buying' : 'Selling'}
                              </Badge>
                            </div>
                          </div>

                          {/* Action buttons based on status and role */}
                          <div className="flex gap-2 mt-4">
                            {isSeller && transaction.status === 'escrow_held' && (
                              <Button
                                onClick={() => handleMarkDelivered(transaction.id)}
                                variant="default"
                                size="sm"
                              >
                                Mark as Delivered
                              </Button>
                            )}
                            
                            {isBuyer && transaction.status === 'delivered' && (
                              <Button
                                onClick={() => handleConfirmDelivery(transaction.id)}
                                variant="default"
                                size="sm"
                              >
                                Confirm Delivery
                              </Button>
                            )}

                            {transaction.listings && (
                              <Link to={`/account/listing-${transaction.listings.id}`}>
                                <Button variant="outline" size="sm">
                                  View Listing
                                </Button>
                              </Link>
                            )}
                          </div>

                          {/* Status info */}
                          <div className="mt-4 p-3 bg-secondary/20 rounded-md text-sm">
                            {transaction.status === 'pending' && (
                              <p>⏳ Waiting for payment confirmation</p>
                            )}
                            {transaction.status === 'escrow_held' && isBuyer && (
                              <p>🔒 Funds are held in escrow. Waiting for seller to deliver.</p>
                            )}
                            {transaction.status === 'escrow_held' && isSeller && (
                              <p>💰 Payment received in escrow. Deliver the account to buyer.</p>
                            )}
                            {transaction.status === 'delivered' && isBuyer && (
                              <p>📦 Seller marked as delivered. Confirm once you receive access.</p>
                            )}
                            {transaction.status === 'delivered' && isSeller && (
                              <p>✅ Waiting for buyer to confirm delivery.</p>
                            )}
                            {transaction.status === 'completed' && (
                              <p>✅ Transaction completed. Funds released to seller.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}