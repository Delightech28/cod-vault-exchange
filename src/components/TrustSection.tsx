import { Shield, Lock, Users, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

const TrustSection = () => {
  return (
    <section id="sell" className="py-20 bg-secondary/30">
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
  );
};

export default TrustSection;
