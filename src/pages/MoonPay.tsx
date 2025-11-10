import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MoonPay = () => {
  const [activeTab, setActiveTab] = useState("buy");
  const [walletAddress, setWalletAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadMoonPayScript();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to access wallet");
      navigate("/auth");
      return;
    }

    // Fetch user's wallet address from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", user.id)
      .single();

    if (profile?.wallet_address) {
      setWalletAddress(profile.wallet_address);
    }
  };

  const loadMoonPayScript = () => {
    const script = document.createElement("script");
    script.src = "https://static.moonpay.com/web-sdk/v1/moonpay-web-sdk.min.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const openMoonPayWidget = (flow: "buy" | "sell") => {
    if (!walletAddress) {
      toast.error("Please add a wallet address in your profile first");
      navigate("/profile");
      return;
    }

    // @ts-ignore - MoonPay SDK loaded via script
    if (typeof window.MoonPayWebSdk !== "undefined") {
      // @ts-ignore
      const moonPaySdk = window.MoonPayWebSdk.init({
        flow: flow,
        environment: "sandbox",
        variant: "overlay",
        params: {
          apiKey: import.meta.env.VITE_MOONPAY_PUBLISHABLE_KEY,
          currencyCode: flow === "buy" ? "eth_base" : "eth",
          walletAddress: walletAddress,
          baseCurrencyCode: "usd",
          colorCode: "#9b87f5",
        }
      });

      moonPaySdk.show();
    } else {
      toast.error("MoonPay SDK not loaded. Please refresh the page.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Wallet Management</h1>
            <p className="text-muted-foreground">
              Buy and sell crypto with MoonPay (Sandbox Mode)
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Buy Crypto
              </TabsTrigger>
              <TabsTrigger value="sell" className="gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                Sell Crypto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Buy Cryptocurrency
                  </CardTitle>
                  <CardDescription>
                    Purchase ETH or USDC on Base network using MoonPay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="p-6 bg-muted rounded-lg text-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => openMoonPayWidget("buy")}
                    >
                      <p className="text-muted-foreground mb-4">
                        Click to open MoonPay widget
                      </p>
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <ArrowDownToLine className="h-5 w-5" />
                        Buy with MoonPay
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>✓ Instant deposits to your Base wallet</p>
                      <p>✓ Support for multiple payment methods</p>
                      <p>✓ Secure and compliant transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sell" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Sell Cryptocurrency
                  </CardTitle>
                  <CardDescription>
                    Cash out your crypto directly to your bank account with MoonPay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="p-6 bg-muted rounded-lg text-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => openMoonPayWidget("sell")}
                    >
                      <p className="text-muted-foreground mb-4">
                        Click to open MoonPay off-ramp widget
                      </p>
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <ArrowUpFromLine className="h-5 w-5" />
                        Sell with MoonPay
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>✓ Direct bank transfers</p>
                      <p>✓ Competitive exchange rates</p>
                      <p>✓ Fast processing times</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoonPay;
