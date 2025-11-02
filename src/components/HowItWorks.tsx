import { Search, Shield, Zap } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse & Select",
    description: "Search through thousands of verified COD accounts with detailed stats and rankings.",
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

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative text-center group"
              >
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
                <p className="text-muted-foreground">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
