import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Dispute {
  id: string;
  transaction_id: string;
  opened_by: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'closed';
  created_at: string;
  resolution_outcome: string | null;
  resolution_notes: string | null;
  transaction: {
    listing_id: string;
    listings: {
      title: string;
    };
  };
  opener_profile: {
    display_name: string | null;
    username: string | null;
  };
}

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionOutcome, setResolutionOutcome] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is admin/moderator
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'moderator');
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    fetchDisputes();
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          transaction:transactions!inner(
            listing_id,
            listings!inner(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch opener profiles
      const disputesWithProfiles = await Promise.all(
        (data || []).map(async (dispute) => {
          const { data: profile } = await supabase
            .rpc('get_public_profile', { p_user_id: dispute.opened_by });

          return {
            ...dispute,
            opener_profile: {
              display_name: profile?.[0]?.display_name || null,
              username: profile?.[0]?.username || null,
            },
          };
        })
      );

      setDisputes(disputesWithProfiles);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'resolved_buyer' || newStatus === 'resolved_seller' || newStatus === 'closed') {
        if (!resolutionOutcome || !resolutionNotes) {
          toast({
            title: 'Missing Information',
            description: 'Please provide resolution outcome and notes.',
            variant: 'destructive',
          });
          setUpdatingStatus(false);
          return;
        }
        updateData.resolution_outcome = resolutionOutcome;
        updateData.resolution_notes = resolutionNotes;
        updateData.resolved_at = new Date().toISOString();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateData.resolved_by = user.id;
        }
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dispute status updated successfully.',
      });

      setSelectedDispute(null);
      setResolutionNotes('');
      setResolutionOutcome('');
      fetchDisputes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'resolved_buyer':
      case 'resolved_seller':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'resolved_buyer':
      case 'resolved_seller':
      case 'closed':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Dispute Management</h1>
          <p className="text-muted-foreground">
            Review and resolve transaction disputes
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading disputes...</p>
            </CardContent>
          </Card>
        ) : disputes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No disputes found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {dispute.transaction.listings.title}
                      </CardTitle>
                      <CardDescription>
                        Opened by{' '}
                        {dispute.opener_profile.display_name ||
                          dispute.opener_profile.username ||
                          'Unknown User'}{' '}
                        •{' '}
                        {formatDistanceToNow(new Date(dispute.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(dispute.status)} className="flex items-center gap-1">
                      {getStatusIcon(dispute.status)}
                      {dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Reason</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.description}
                    </p>
                  </div>

                  {(dispute.status === 'resolved_buyer' || dispute.status === 'resolved_seller' || dispute.status === 'closed') && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-1">Resolution</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Outcome:</strong> {dispute.resolution_outcome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {dispute.resolution_notes}
                      </p>
                    </div>
                  )}

                  {selectedDispute?.id === dispute.id ? (
                    <div className="border-t pt-4 space-y-4">
                      <Select
                        value={resolutionOutcome}
                        onValueChange={setResolutionOutcome}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resolved_buyer">
                            Resolved in Buyer's Favor
                          </SelectItem>
                          <SelectItem value="resolved_seller">
                            Resolved in Seller's Favor
                          </SelectItem>
                          <SelectItem value="closed">
                            Closed - No Action
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Resolution notes..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="min-h-[100px]"
                      />

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleUpdateStatus(dispute.id, resolutionOutcome)
                          }
                          disabled={updatingStatus || !resolutionOutcome}
                        >
                          Mark as Resolved
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedDispute(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    dispute.status !== 'resolved_buyer' && dispute.status !== 'resolved_seller' && dispute.status !== 'closed' && (
                      <div className="flex gap-2">
                        {dispute.status === 'open' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(dispute.id, 'under_review')
                            }
                            disabled={updatingStatus}
                          >
                            Start Review
                          </Button>
                        )}
                        {dispute.status === 'under_review' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            Resolve Dispute
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/transactions/${dispute.transaction_id}`)
                          }
                        >
                          View Transaction
                        </Button>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
