import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="support" className="bg-secondary/50 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
          <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="text-xl font-bold text-primary">Trade</div>
              <div className="text-xl font-bold text-foreground">Ops</div>
            </Link>
            <p className="text-muted-foreground text-sm">
              The most trusted marketplace for buying and selling Call of Duty accounts.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Browse Accounts</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Modern Warfare</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Warzone</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Black Ops</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Security</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TradeOps Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
