import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Star, Search, Lock, Users, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";

interface Listing {
  id: string;
  title: string;
  game_name: string;
  level: number | null;
  kd_ratio: string | null;
  price: number;
  seller: {
    is_verified_seller: boolean;
    average_rating: number;
  };
  is_available: boolean;
}

const features = [
  {
    icon: Shield,
    title: "Verified Sellers",
    description: "All sellers are thoroughly vetted and verified before listing.",
  },
  {
    icon: Lock,
    title: "Secure Transactions",
    description: "Bank-level encryption and escrow service for your protection.",
  },
  {
    icon: Users,
    title: "24/7 Support",
    description: "Expert support team available around the clock to help you.",
  },
  {
    icon: CheckCircle,
    title: "Money-Back Guarantee",
    description: "Full refund if account details don't match the description.",
  },
];

const Index = () => {
  const [featuredAccounts, setFeaturedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch user country
      let country = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          country = profile.country;
        }
      }

      // Fetch first 4 approved and available listings
      const { data: listings } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          game_name,
          level,
          kd_ratio,
          price,
          seller:profiles!listings_seller_id_fkey (
            is_verified_seller,
            average_rating
          ),
          is_available
        `)
        .eq('status', 'approved')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (listings) {
        const mapped = listings.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          game: listing.game_name,
          level: listing.level ? `Level ${listing.level}` : 'Max Level',
          kd: listing.kd_ratio || 'N/A',
          price: formatPrice(listing.price, country),
          verified: listing.seller?.is_verified_seller || false,
          rating: listing.seller?.average_rating || 0,
        }));
        setFeaturedAccounts(mapped);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      {/* Featured Accounts */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Accounts</h2>
            <p className="text-muted-foreground text-lg">
              Premium verified accounts ready for instant delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredAccounts.map((account) => (
              <Card 
                key={account.id} 
                className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,124,89,0.3)] group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {account.game}
                    </Badge>
                    {account.verified && (
                      <Shield className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {account.title}
                  </h3>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-semibold">{account.level}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">K/D Ratio</span>
                    <span className="font-semibold text-primary">{account.kd}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold">{account.rating}</span>
                    <span className="text-muted-foreground">(50+ reviews)</span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-accent">{account.price}</div>
                  <Link to={`/account/${account.id}`}>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/marketplace">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View All Accounts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">
              The most trusted marketplace for Call of Duty accounts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="bg-card border-border hover:border-primary transition-all duration-300 group"
                >
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="bg-primary/10 rounded-full p-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-8 text-sm text-muted-foreground">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">50K+</div>
                <div>Accounts Sold</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary mb-1">10K+</div>
                <div>Active Users</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary mb-1">4.9</div>
                <div>Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
