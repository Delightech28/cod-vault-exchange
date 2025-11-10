import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";

const MoonPay = () => {
  const [activeTab, setActiveTab] = useState("buy");

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
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground mb-4">
                        MoonPay widget will be displayed here (Sandbox)
                      </p>
                      <Button disabled className="gap-2">
                        <ArrowDownToLine className="h-4 w-4" />
                        Buy with MoonPay
                      </Button>
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
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground mb-4">
                        MoonPay off-ramp widget will be displayed here (Sandbox)
                      </p>
                      <Button disabled className="gap-2">
                        <ArrowUpFromLine className="h-4 w-4" />
                        Sell with MoonPay
                      </Button>
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
