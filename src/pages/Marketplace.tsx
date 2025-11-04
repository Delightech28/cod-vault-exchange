import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Star, Search, Filter, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [realListings, setRealListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCountry();
    fetchListings();
  }, []);

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

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles!seller_id (
            username,
            is_verified_seller
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRealListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map real listings
  const allAccounts = realListings.map(listing => ({
    id: `listing-${listing.id}`,
    title: listing.title,
    game: listing.game_name,
    level: listing.rank || `Level ${listing.level || 0}`,
    kd: listing.kd_ratio || "N/A",
    price: formatPrice(listing.price, userCountry),
    verified: listing.verified_at !== null,
    rating: 4.5,
    reviews: 0,
    views: listing.views_count || 0,
    sellerName: listing.profiles?.username || "Unknown",
    sellerVerified: listing.profiles?.is_verified_seller || false,
  }));

  const filteredAccounts = allAccounts.filter((account) => {
    const matchesSearch = account.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = gameFilter === "all" || account.game === gameFilter;
    return matchesSearch && matchesGame;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Browse through {allAccounts.length}+ verified Call of Duty accounts
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="MW3">Modern Warfare 3</SelectItem>
                <SelectItem value="Warzone 2.0">Warzone 2.0</SelectItem>
                <SelectItem value="MW2">Modern Warfare 2</SelectItem>
                <SelectItem value="Black Ops Cold War">Black Ops Cold War</SelectItem>
                <SelectItem value="COD Mobile">Call of Duty Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'}
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading listings...
            </div>
          ) : filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <Card 
                key={account.id} 
                className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,124,89,0.3)] group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {account.game}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{account.views}</span>
                      </div>
                      {account.verified && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {account.title}
                  </h3>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-semibold flex items-center gap-1">
                      {account.sellerName}
                      <VerifiedBadge isVerified={account.sellerVerified} size="sm" />
                    </span>
                  </div>
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
                    <span className="text-muted-foreground">({account.reviews} reviews)</span>
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
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No accounts found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setGameFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
