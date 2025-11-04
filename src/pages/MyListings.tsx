import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Eye, DollarSign, Clock, Plus, ShoppingBag, Trash2, Edit, PackageX } from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  game_name: string;
  price: number;
  status: string;
  views_count: number;
  created_at: string;
  level: number | null;
  rank: string | null;
  kd_ratio: string | null;
  verified_at: string | null;
  is_available: boolean;
}

export default function MyListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserListings();
  }, []);

  const fetchUserListings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setListings(data || []);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load listings", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      case "pending_verification":
        return "bg-blue-500";
      case "sold":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const openDeleteModal = (listingId: string) => {
    setListingToDelete(listingId);
    setDeleteModalOpen(true);
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingToDelete);

      if (error) throw error;

      toast.success("Listing deleted successfully");
      // Remove from local state
      setListings(prev => prev.filter(l => l.id !== listingToDelete));
      setDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing", {
        description: error.message,
      });
    }
  };

  const handleMarkAsSold = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_available: false })
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing marked as sold");
      // Update local state
      setListings(prev => 
        prev.map(l => l.id === listingId ? { ...l, is_available: false } : l)
      );
    } catch (error: any) {
      console.error("Error marking listing as sold:", error);
      toast.error("Failed to mark as sold", {
        description: error.message,
      });
    }
  };

  const handleMarkAsAvailable = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_available: true })
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing marked as available");
      // Update local state
      setListings(prev => 
        prev.map(l => l.id === listingId ? { ...l, is_available: true } : l)
      );
    } catch (error: any) {
      console.error("Error marking listing as available:", error);
      toast.error("Failed to mark as available", {
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">
              Manage all your account listings in one place
            </p>
          </div>
          <Button asChild>
            <Link to="/sell">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-4">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first listing to start selling
              </p>
              <Button asChild>
                <Link to="/sell">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{listing.game_name}</Badge>
                    <Badge className={getStatusColor(listing.status)}>
                      {getStatusLabel(listing.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">
                    {listing.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Level</div>
                      <div className="font-semibold">
                        {listing.rank || `Level ${listing.level || 0}`}
                      </div>
                    </div>
                    {listing.kd_ratio && (
                      <div>
                        <div className="text-muted-foreground">K/D</div>
                        <div className="font-semibold text-primary">
                          {listing.kd_ratio}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{listing.views_count || 0} views</span>
                    </div>
                    {listing.verified_at && (
                      <div className="flex items-center gap-1 text-primary">
                        <Shield className="h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Listed {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-2xl font-bold text-accent">
                        <DollarSign className="h-5 w-5" />
                        {listing.price}
                      </div>
                      {!listing.is_available && (
                        <Badge variant="destructive" className="text-xs">
                          SOLD
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link to={`/sell?edit=${listing.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      
                      {listing.status === 'approved' && (
                        <>
                          {listing.is_available ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsSold(listing.id)}
                              className="text-orange-500 hover:text-orange-600"
                            >
                              <PackageX className="h-4 w-4 mr-1" />
                              Mark Sold
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsAvailable(listing.id)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <PackageX className="h-4 w-4 mr-1" />
                              Mark Available
                            </Button>
                          )}
                        </>
                      )}
                      
                      {(listing.status === 'draft' || listing.status === 'rejected') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteModal(listing.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteListing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
