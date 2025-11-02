import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Star } from "lucide-react";

const accounts = [
  {
    id: 1,
    title: "Prestige Master Account",
    game: "MW3",
    level: "Prestige 10",
    kd: "2.5 K/D",
    price: "$299",
    verified: true,
    rating: 4.9,
  },
  {
    id: 2,
    title: "High Level Warzone",
    game: "Warzone 2.0",
    level: "Level 450",
    kd: "1.8 K/D",
    price: "$199",
    verified: true,
    rating: 4.8,
  },
  {
    id: 3,
    title: "Damascus Unlocked",
    game: "MW2",
    level: "Max Level",
    kd: "2.1 K/D",
    price: "$349",
    verified: true,
    rating: 5.0,
  },
  {
    id: 4,
    title: "Ranked Master Account",
    game: "MW3",
    level: "Master Rank",
    kd: "3.0 K/D",
    price: "$449",
    verified: true,
    rating: 4.9,
  },
];

const FeaturedAccounts = () => {
  return (
    <section id="marketplace" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Accounts</h2>
          <p className="text-muted-foreground text-lg">
            Premium verified accounts ready for instant delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {accounts.map((account) => (
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
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View All Accounts
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAccounts;
