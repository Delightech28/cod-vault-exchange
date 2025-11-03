import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Star, ArrowLeft, User, Trophy, Target, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getCurrencyInfo } from "@/lib/currency";

const accountsData: Record<string, any> = {
  "1": {
    id: 1,
    title: "Prestige Master Account",
    game: "MW3",
    level: "Prestige 10",
    kd: "2.5",
    price: "$299",
    verified: true,
    rating: 4.9,
    reviews: 52,
    description: "Fully leveled Prestige Master account with all weapons unlocked and maxed. Perfect for competitive play.",
    playtime: "500+ hours",
    wins: "2,500+",
    platform: "Cross-platform",
    seller: "ProGamer123",
    sellerRating: 4.8,
    features: [
      "All weapons unlocked",
      "Max prestige level",
      "Rare camos unlocked",
      "Competitive rank ready",
      "Email changeable",
      "Lifetime support"
    ]
  }
};

const AccountDetails = () => {
  const { id } = useParams();
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingTransaction, setExistingTransaction] = useState<any>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchUserCountry();
    };
    init();
  }, []);

  useEffect(() => {
    if (userCountry !== null) {
      fetchAccountDetails();
    }
  }, [id, userCountry]);

  useEffect(() => {
    if (userCountry && account && account.priceAmount) {
      // Update formatted price when country changes
      const newFormattedPrice = formatPrice(account.priceAmount, userCountry);
      if (newFormattedPrice !== account.price) {
        setAccount((prev: any) => ({
          ...prev,
          price: newFormattedPrice
        }));
      }
    }
  }, [userCountry, account?.priceAmount]);

  const fetchUserCountry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.country) {
        setUserCountry(profile.country);
      }
    }
  };

  const fetchAccountDetails = async () => {
    try {
      if (id?.startsWith("listing-")) {
        const listingId = id.replace("listing-", "");
        
        await supabase.rpc("increment_listing_views", { listing_id: listingId });
        
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", listingId)
          .maybeSingle();

        if (error) throw error;

          if (data) {
          let sellerName = "Anonymous";
          if (data.seller_id) {
            const { data: profile } = await supabase
              .rpc("get_public_profile", { p_user_id: data.seller_id })
              .maybeSingle();
            
            if (profile) {
              sellerName = profile.display_name || profile.full_name || profile.username || "Anonymous";
            }
          }
          
          setAccount({
            id: `listing-${data.id}`,
            listingId: data.id,
            title: data.title,
            game: data.game_name,
            level: data.level ? `Level ${data.level}` : "N/A",
            rank: data.rank || "N/A",
            kd: data.kd_ratio || "N/A",
            price: formatPrice(data.price, userCountry),
            priceAmount: data.price,
            verified: data.verified_at !== null,
            rating: 4.5,
            reviews: 0,
            description: data.description || "No description provided.",
            playtime: data.playtime || "N/A",
            wins: data.total_wins || "N/A",
            platform: "Cross-platform",
            seller: sellerName,
            sellerId: data.seller_id,
            sellerRating: 4.5,
            features: data.items_included || [],
            viewsCount: data.views_count || 0,
          });

          // Check for existing transaction with payment completed
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: transactionData } = await supabase
              .from("transactions")
              .select("id, status")
              .eq("listing_id", data.id)
              .eq("buyer_id", user.id)
              .in("status", ["escrow_held", "delivered", "completed"])
              .maybeSingle();
            
            setExistingTransaction(transactionData);
          }
        }
      } else {
        setAccount(accountsData[id || "1"] || accountsData["1"]);
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
      setAccount(accountsData[id || "1"] || accountsData["1"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to purchase");
        return;
      }

      if (id?.startsWith("listing-")) {
        const listingId = id.replace("listing-", "");
        const { data: listing } = await supabase
          .from("listings")
          .select("seller_id, price, title")
          .eq("id", listingId)
          .single();

        if (listing?.seller_id === user.id) {
          toast.error("Cannot buy your own listing");
          return;
        }

        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", user.id)
          .single();

        const buyerName = buyerProfile?.display_name || buyerProfile?.username || "Someone";

        const { data: transaction, error } = await supabase
          .from("transactions")
          .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: listing.seller_id,
            amount: listing.price,
            platform_fee: listing.price * 0.05,
            seller_payout: listing.price * 0.95,
            status: "pending"
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Order created! Redirecting...");
        
        setTimeout(() => {
          window.location.href = `/transaction/${transaction.id}`;
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-12">Account not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <Link to="/marketplace" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{account.game}</Badge>
                  <h1 className="text-4xl font-bold mb-2">{account.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold text-foreground">{account.rating}</span>
                      <span>({account.reviews} reviews)</span>
                    </div>
                    {account.verified && (
                      <div className="flex items-center gap-1 text-primary">
                        <Shield className="h-4 w-4" />
                        <span>Verified Account</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-accent">{account.price}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{account.description}</p>
              </div>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Account Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Level</div>
                      <div className="font-semibold">{account.level}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">K/D Ratio</div>
                      <div className="font-semibold text-primary">{account.kd}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Playtime</div>
                      <div className="font-semibold">{account.playtime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Wins</div>
                      <div className="font-semibold">{account.wins}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Features Included</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {account.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card border-border sticky top-24">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="text-3xl font-bold text-accent mb-1">{account.price}</div>
                  <div className="text-sm text-muted-foreground">One-time payment</div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handlePurchase}
                >
                  Buy Now
                </Button>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Seller Information</span>
                  </div>
                  <div className="ml-6">
                    <div className="font-medium">{account.seller}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span>{account.sellerRating} seller rating</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-semibold">{account.platform}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold text-primary">Instant</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Warranty</span>
                    <span className="font-semibold">30 Days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountDetails;
