import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Wallet, TrendingUp, Shield, MessageSquare, ShoppingBag, Plus, Download, AlertCircle } from 'lucide-react';

interface Profile {
  username: string;
  display_name: string;
  account_type: 'buyer' | 'seller' | 'both';
  kyc_status: string;
  is_verified_seller: boolean;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, display_name, account_type, kyc_status, is_verified_seller, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    if (profileData && !profileData.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.display_name || profile?.username}
            </h1>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
          <p className="text-muted-foreground">
            {profile?.account_type === 'buyer' && 'Browse and purchase game accounts securely'}
            {profile?.account_type === 'seller' && 'Manage your listings and sales'}
            {profile?.account_type === 'both' && 'Buy and sell game accounts on the marketplace'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Wallet Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available balance
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Funds
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
              </div>
              <Link to="/wallet" className="text-xs text-primary hover:underline block mt-2">
                Why use wallet? →
              </Link>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile?.is_verified_seller ? (
                  <Badge className="bg-green-500">Verified Seller</Badge>
                ) : (
                  <Badge variant="secondary">Not Verified</Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  KYC Status: {profile?.kyc_status?.replace('_', ' ')}
                </p>
              </div>
              {!profile?.is_verified_seller && (
                <Button size="sm" variant="outline" className="w-full mt-4">
                  Complete KYC
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active transactions
              </p>
              <Button size="sm" variant="link" className="px-0 mt-2" asChild>
                <Link to="/transactions">View all transactions →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col py-6" asChild>
                <Link to="/marketplace">
                  <ShoppingBag className="h-6 w-6 mb-2" />
                  Browse Listings
                </Link>
              </Button>

              {(profile?.account_type === 'seller' || profile?.account_type === 'both') && (
                <Button variant="outline" className="h-auto flex-col py-6" asChild>
                  <Link to="/sell">
                    <Plus className="h-6 w-6 mb-2" />
                    Create Listing
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="h-auto flex-col py-6" asChild>
                <Link to="/profile">
                  <Shield className="h-6 w-6 mb-2" />
                  Verify Identity
                </Link>
              </Button>

              <Button variant="outline" className="h-auto flex-col py-6" asChild>
                <Link to="/support">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Tips & Safety
            </CardTitle>
            <CardDescription>How escrow keeps your transactions secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">How Escrow Works</h4>
                <p className="text-sm text-muted-foreground">
                  Your payment is held securely by the platform until you confirm delivery. 
                  Click "Deal Accepted" only after verifying the account details.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Stay Safe</h4>
                <p className="text-sm text-muted-foreground">
                  Never share personal information or credentials in chat. Use the secure 
                  delivery system and open a dispute if anything seems wrong.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
