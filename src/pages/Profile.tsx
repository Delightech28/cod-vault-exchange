import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Shield, CheckCircle, Clock, XCircle, Edit2, Save, Star, Camera } from 'lucide-react';
import { ReviewsList } from '@/components/ReviewsList';

interface ProfileData {
  username: string;
  display_name: string;
  country: string;
  timezone: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified: boolean;
  kyc_status: string;
  is_verified_seller: boolean;
  account_type: string;
  created_at: string;
  user_id: string;
  average_rating: number;
  review_count: number;
  avatar_url?: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('username, display_name, country, timezone, phone_number, phone_verified, email_verified, kyc_status, is_verified_seller, account_type, created_at, user_id, average_rating, review_count, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
      return;
    }

    setProfile(profileData as ProfileData);
    setFormData(profileData as ProfileData);
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Error',
        description: uploadError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with explicit type casting
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl } as any)
      .eq('user_id', user?.id);

    setLoading(false);

    if (updateError) {
      toast({
        title: 'Error',
        description: updateError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Avatar updated successfully',
    });

    checkAuthAndLoadProfile();
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
      })
      .eq('user_id', user?.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Profile updated successfully',
    });

    setEditing(false);
    checkAuthAndLoadProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and verification</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.username} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                      {profile.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                    {profile.is_verified_seller && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Seller
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">@{profile.username}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {profile.account_type?.charAt(0).toUpperCase() + profile.account_type?.slice(1)}
                    </Badge>
                    <Badge variant={profile.email_verified ? 'default' : 'secondary'}>
                      {profile.email_verified ? '✓ Email Verified' : 'Email Not Verified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    {!editing ? (
                      <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                          Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={loading}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={editing ? formData.display_name : profile.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        disabled={!editing}
                        className={!editing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profile.country}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={profile.timezone}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone_number || 'Not provided'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joined">Member Since</Label>
                      <Input
                        id="joined"
                        value={new Date(profile.created_at).toLocaleDateString()}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                  <CardDescription>
                    Complete verification to unlock seller features and increase trust
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* KYC Status */}
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Identity Verification (KYC)</h3>
                        {profile.kyc_status === 'verified' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {profile.kyc_status === 'pending' && (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        {profile.kyc_status === 'not_submitted' && (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Status: <span className="font-medium">{profile.kyc_status?.replace('_', ' ')}</span>
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Verified seller badge</li>
                        <li>• Higher transaction limits</li>
                        <li>• Increased buyer trust</li>
                      </ul>
                    </div>
                    {profile.kyc_status === 'not_submitted' && (
                      <Button>Start Verification</Button>
                    )}
                    {profile.kyc_status === 'pending' && (
                      <Button variant="secondary" disabled>Under Review</Button>
                    )}
                  </div>

                  {/* Phone Verification */}
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Phone Verification</h3>
                        {profile.phone_verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.phone_verified ? 'Your phone is verified' : 'Add and verify your phone number'}
                      </p>
                    </div>
                    {profile.phone_verified && (
                      <Badge className="bg-green-500">Verified</Badge>
                    )}
                  </div>

                  {/* Email Verification */}
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Email Verification</h3>
                        {profile.email_verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.email_verified ? 'Your email is verified' : 'Verify your email address'}
                      </p>
                    </div>
                    {profile.email_verified && (
                      <Badge className="bg-green-500">Verified</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {profile && <ReviewsList userId={profile.user_id} />}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
