import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Star, ArrowLeft, User, Trophy, Target, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  const account = accountsData[id || "1"] || accountsData["1"];

  const handlePurchase = () => {
    toast.success("Added to cart! Proceeding to checkout...", {
      description: "You'll be redirected to secure payment",
    });
  };

  const handleContact = () => {
    toast.info("Opening chat with seller...", {
      description: "Feature coming soon",
    });
  };

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
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
                  onClick={handlePurchase}
                >
                  Buy Now
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleContact}
                >
                  Contact Seller
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
