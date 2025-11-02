import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">COD</div>
            <div className="text-2xl font-bold text-foreground">Accounts</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#marketplace" 
              className="text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Marketplace
            </a>
            <a 
              href="#how-it-works" 
              className="text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </a>
            <a 
              href="#sell" 
              className="text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('sell')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Sell Account
            </a>
            <a 
              href="#support" 
              className="text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Support
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={() => alert('Sign In feature coming soon!')}>
              Sign In
            </Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <a 
              href="#marketplace" 
              className="block text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Marketplace
            </a>
            <a 
              href="#how-it-works" 
              className="block text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </a>
            <a 
              href="#sell" 
              className="block text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById('sell')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Sell Account
            </a>
            <a 
              href="#support" 
              className="block text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Support
            </a>
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setIsMenuOpen(false);
                  alert('Sign In feature coming soon!');
                }}
              >
                Sign In
              </Button>
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  setIsMenuOpen(false);
                  document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
