import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Upload } from "lucide-react";
import { toast } from "sonner";

const SellAccount = () => {
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    level: "",
    kd: "",
    price: "",
    description: "",
    platform: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.game || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Account listing submitted!", {
      description: "Your account will be reviewed and listed within 24 hours.",
    });

    // Reset form
    setFormData({
      title: "",
      game: "",
      level: "",
      kd: "",
      price: "",
      description: "",
      platform: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Sell Your Account</h1>
            <p className="text-muted-foreground text-lg">
              List your Call of Duty account and reach thousands of potential buyers
            </p>
          </div>

          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle>Why Sell With Us?</CardTitle>
              <CardDescription>
                Join thousands of sellers who trust our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">0%</div>
                <div className="text-sm text-muted-foreground">Commission Fee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">24h</div>
                <div className="text-sm text-muted-foreground">Average Listing Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-muted-foreground">Secure Transactions</div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Provide accurate information to attract buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Account Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Prestige Master MW3 Account"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game">Game *</Label>
                    <Select value={formData.game} onValueChange={(value) => handleChange("game", value)}>
                      <SelectTrigger id="game">
                        <SelectValue placeholder="Select game" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MW3">Modern Warfare 3</SelectItem>
                        <SelectItem value="Warzone 2.0">Warzone 2.0</SelectItem>
                        <SelectItem value="MW2">Modern Warfare 2</SelectItem>
                        <SelectItem value="Black Ops Cold War">Black Ops Cold War</SelectItem>
                        <SelectItem value="Vanguard">Vanguard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={formData.platform} onValueChange={(value) => handleChange("platform", value)}>
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cross-platform">Cross-platform</SelectItem>
                        <SelectItem value="PlayStation">PlayStation</SelectItem>
                        <SelectItem value="Xbox">Xbox</SelectItem>
                        <SelectItem value="PC">PC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level/Rank</Label>
                    <Input
                      id="level"
                      placeholder="e.g., Prestige 10"
                      value={formData.level}
                      onChange={(e) => handleChange("level", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kd">K/D Ratio</Label>
                    <Input
                      id="kd"
                      placeholder="e.g., 2.5"
                      value={formData.kd}
                      onChange={(e) => handleChange("kd", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your account's features, unlocks, and any special achievements..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="299"
                      className="pl-10"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Screenshots (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    Submit Listing
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        title: "",
                        game: "",
                        level: "",
                        kd: "",
                        price: "",
                        description: "",
                        platform: "",
                      });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SellAccount;
