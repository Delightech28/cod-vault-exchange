import { useState, useEffect } from "react";
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
import { getCurrencyInfo, formatPrice } from "@/lib/currency";

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
    playtime: "",
    totalWins: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Check KYC status and user country on component mount
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("kyc_status, country")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setKycStatus(profile?.kyc_status || "not_submitted");
          setUserCountry(profile?.country || null);
        }
      } catch (error) {
        console.error("Error checking KYC status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, [navigate]);

  const startKycVerification = async () => {
    setIsStartingKyc(true);
    try {
      const { data, error } = await supabase.functions.invoke('start-kyc-hp');

      if (error) throw error;

      if (data?.verification_url) {
        toast.success('Redirecting to verification...');
        window.location.href = data.verification_url;
      } else {
        throw new Error('No verification URL received');
      }
    } catch (error: any) {
      console.error('Error starting KYC:', error);
      toast.error('Failed to start verification', {
        description: error.message || 'Please try again later',
      });
      setIsStartingKyc(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload MP4, MOV, AVI, or WEBM files only",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 52428800) {
      toast.error("File too large", {
        description: "Video must be under 50MB",
      });
      return;
    }

    setVideoFile(file);
    toast.success("Video selected successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // KYC verification check disabled for now - allow all users to list
    // if (kycStatus !== "verified") {
    //   toast.error("You must complete identity verification before listing", {
    //     description: "Please complete KYC verification in your profile.",
    //     action: {
    //       label: "Go to Profile",
    //       onClick: () => navigate("/profile"),
    //     },
    //   });
    //   return;
    // }
    
    // Custom validation with responsive error messages
    if (!formData.title.trim()) {
      toast.error("Account title is required", {
        description: "Please provide a title for your account listing",
      });
      return;
    }
    
    if (!formData.game) {
      toast.error("Game selection is required", {
        description: "Please select which game this account is for",
      });
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required", {
        description: "Please enter a price greater than 0",
      });
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

      let videoUrl = null;

      // Upload video if selected
      if (videoFile) {
        setIsUploadingVideo(true);
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-videos')
          .upload(fileName, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Video upload error:", uploadError);
          toast.error("Failed to upload video", {
            description: "Please try again or continue without video",
          });
          setIsUploadingVideo(false);
          // Don't return, allow listing creation without video
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('listing-videos')
            .getPublicUrl(fileName);
          
          videoUrl = publicUrl;
          setIsUploadingVideo(false);
        }
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
          kd_ratio: formData.kd || null,
          playtime: formData.playtime || null,
          total_wins: formData.totalWins || null,
          price: parseFloat(formData.price),
          description: formData.description,
          items_included: itemsArray,
          video_url: videoUrl,
          status: "approved" as const, // Auto-approve all new listings
        }]);

      if (error) throw error;

      toast.success("Account listing published!", {
        description: "Your listing is now live in the marketplace.",
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
        playtime: "",
        totalWins: "",
      });
      setVideoFile(null);

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

  const isNigeriaUser = userCountry === "Nigeria";
  const currencyInfo = getCurrencyInfo(userCountry);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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

          {kycStatus !== "verified" && (
            <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="text-yellow-500">⚠️</div>
                  <div>
                    <p className="font-semibold">Identity Verification Required</p>
                    <p className="text-sm text-muted-foreground">
                      You must complete identity verification before you can list accounts.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={startKycVerification}
                      disabled={isStartingKyc}
                    >
                      {isStartingKyc ? 'Starting...' : 'Complete Verification'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                        <SelectItem value="COD Mobile">Call of Duty Mobile</SelectItem>
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
                        <SelectItem value="Mobile (iOS/Android)">Mobile (iOS/Android)</SelectItem>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="playtime">Playtime</Label>
                    <Input
                      id="playtime"
                      placeholder="e.g., 500+ hours"
                      value={formData.playtime}
                      onChange={(e) => handleChange("playtime", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalWins">Total Wins</Label>
                    <Input
                      id="totalWins"
                      placeholder="e.g., 2,500+"
                      value={formData.totalWins}
                      onChange={(e) => handleChange("totalWins", e.target.value)}
                    />
                  </div>
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
                  <Label htmlFor="price">
                    {isNigeriaUser ? `Price (${currencyInfo.code})` : "Price (USD)"} *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      {currencyInfo.symbol}
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder={isNigeriaUser ? "15,000" : "299"}
                      className="pl-10"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isNigeriaUser 
                      ? `Enter the price in Nigerian Naira (${currencyInfo.code})`
                      : "Enter the price in US Dollars (USD)"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-upload">Proof Video</Label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="video-upload"
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block"
                  >
                    <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">
                      {videoFile ? videoFile.name : "Click to upload video proof"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      MP4, MOV, AVI, WEBM up to 50MB (single file)
                    </div>
                  </label>
                  {videoFile && (
                    <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                      <span className="text-sm truncate">{videoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVideoFile(null);
                          const input = document.getElementById('video-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                    disabled={isSubmitting || isUploadingVideo}
                  >
                    {isUploadingVideo ? "Uploading video..." : isSubmitting ? "Submitting..." : "Submit Listing"}
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
                        playtime: "",
                        totalWins: "",
                      });
                      setVideoFile(null);
                      const input = document.getElementById('video-upload') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    disabled={isSubmitting || isUploadingVideo}
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
