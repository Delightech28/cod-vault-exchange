import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { DollarSign, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SellAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    level: "",
    rank: "",
    kd: "",
    price: "",
    description: "",
    platform: "",
    itemsIncluded: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.game || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a listing");
        navigate("/auth");
        return;
      }

      const itemsArray = formData.itemsIncluded
        ? formData.itemsIncluded.split(",").map(item => item.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from("listings")
        .insert([{
          seller_id: user.id,
          title: formData.title,
          game_name: formData.game,
          level: formData.level ? parseInt(formData.level) : null,
          rank: formData.rank || null,
          price: parseFloat(formData.price),
          description: formData.description,
          items_included: itemsArray,
          status: "draft" as const,
        }]);

      if (error) throw error;

      toast.success("Account listing submitted!", {
        description: "Your listing has been created and will be reviewed soon.",
      });

      // Reset form
      setFormData({
        title: "",
        game: "",
        level: "",
        rank: "",
        kd: "",
        price: "",
        description: "",
        platform: "",
        itemsIncluded: "",
      });

      // Navigate to marketplace after a short delay
      setTimeout(() => navigate("/marketplace"), 1500);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error("Failed to submit listing", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      type="number"
                      placeholder="e.g., 55"
                      value={formData.level}
                      onChange={(e) => handleChange("level", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rank">Rank</Label>
                    <Input
                      id="rank"
                      placeholder="e.g., Prestige 10"
                      value={formData.rank}
                      onChange={(e) => handleChange("rank", e.target.value)}
                    />
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="itemsIncluded">Items Included</Label>
                  <Input
                    id="itemsIncluded"
                    placeholder="e.g., All weapons, Rare camos, Max prestige (comma separated)"
                    value={formData.itemsIncluded}
                    onChange={(e) => handleChange("itemsIncluded", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple items with commas</p>
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
                  <Label>Gameplay Video (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      MP4, MOV up to 50MB
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Listing"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        title: "",
                        game: "",
                        level: "",
                        rank: "",
                        kd: "",
                        price: "",
                        description: "",
                        platform: "",
                        itemsIncluded: "",
                      });
                    }}
                    disabled={isSubmitting}
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
