import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import heroImage from "@/assets/hero-cod.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Buy & Sell <span className="text-primary">Call of Duty</span> Accounts
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join the most trusted marketplace for COD accounts. Secure transactions, instant delivery, and verified sellers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
              Browse Accounts
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Sell Your Account
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-card border border-border rounded-lg p-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <input
              type="text"
              placeholder="Search accounts..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
