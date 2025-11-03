import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Shield, Zap, UserPlus, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const buyingSteps = [
  {
    icon: Search,
    title: "Browse & Select",
    description: "Search through thousands of verified accounts with detailed stats and rankings.",
  },
  {
    icon: Shield,
    title: "Secure Purchase",
    description: "Complete your transaction safely with our buyer protection and escrow service.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Receive account details immediately after payment confirmation. Start playing now!",
  },
];

const sellingSteps = [
  {
    icon: UserPlus,
    title: "Create Listing",
    description: "Fill out your account details, stats, and upload screenshots of your achievements.",
  },
  {
    icon: DollarSign,
    title: "Set Your Price",
    description: "Price your account competitively based on its level, K/D, and unlocked content.",
  },
  {
    icon: CheckCircle,
    title: "Get Paid",
    description: "Receive payment instantly when your account sells. Funds are securely transferred to you.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">How It Works</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're buying or selling, our platform makes it simple and secure
          </p>
        </div>

        {/* Buying Process */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Buying an Account</h2>
            <p className="text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {buyingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center group">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
                      <div className="relative bg-card border-2 border-primary rounded-full p-6 group-hover:scale-110 transition-transform">
                        <Icon className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2 text-sm font-semibold text-primary">
                    Step {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>

                  {index < buyingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link to="/marketplace">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Browse Accounts
              </Button>
            </Link>
          </div>
        </section>

        {/* Selling Process */}
        <section className="mb-20 bg-secondary/30 -mx-4 px-4 py-16 md:mx-0 md:rounded-lg">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Selling an Account</h2>
              <p className="text-muted-foreground">List your account and get paid</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {sellingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative text-center group">
                    <div className="mb-6 flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
                        <div className="relative bg-card border-2 border-primary rounded-full p-6 group-hover:scale-110 transition-transform">
                          <Icon className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-2 text-sm font-semibold text-primary">
                      Step {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>

                    {index < sellingSteps.length - 1 && (
                      <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link to="/sell">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Features */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Trust Us?</h2>
            <p className="text-muted-foreground">Your security is our priority</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Verified Sellers",
                description: "All sellers thoroughly vetted",
              },
              {
                icon: Shield,
                title: "Buyer Protection",
                description: "Money-back guarantee",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                description: "Bank-level encryption",
              },
              {
                icon: Shield,
                title: "24/7 Support",
                description: "Always here to help",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-card border-border hover:border-primary transition-all">
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="bg-primary/10 rounded-full p-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
