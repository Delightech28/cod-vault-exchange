import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedAccounts from "@/components/FeaturedAccounts";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <FeaturedAccounts />
      <HowItWorks />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;
