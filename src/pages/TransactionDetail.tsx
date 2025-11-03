import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Clock, Check, AlertCircle, Send, Paperclip,
  Shield, Wallet, Package
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Transaction {
  id: string;
  amount: number;
  platform_fee: number;
  seller_payout: number;
  status: string;
  created_at: string;
  delivered_at: string | null;
  acceptance_deadline: string | null;
  buyer_id: string;
  seller_id: string;
  listings: {
    title: string;
    game_name: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_system_message: boolean;
  created_at: string;
}

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
  }, [id]);

  useEffect(() => {
    if (transaction?.acceptance_deadline) {
      const timer = setInterval(() => {
        const deadline = new Date(transaction.acceptance_deadline!);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("00:00:00");
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [transaction]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    fetchTransaction();
    fetchMessages();
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('transaction-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          listings (title, game_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      toast.error("Failed to load transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          transaction_id: id,
          sender_id: currentUserId,
          content: newMessage,
          is_system_message: false
        });

      if (error) throw error;

      setNewMessage("");
      
      // Send notification to other party
      const recipientId = transaction?.buyer_id === currentUserId 
        ? transaction?.seller_id 
        : transaction?.buyer_id;

      if (recipientId) {
        await supabase.from("notifications").insert({
          user_id: recipientId,
          title: "New Message",
          message: `You have a new message about ${transaction?.listings?.title}`,
          type: "message",
          related_id: id
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handlePayment = async () => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ 
          status: "escrow_held",
          escrow_held_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Payment processed! Funds held in escrow");
      fetchTransaction();

      // Send notification to seller
      if (transaction) {
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", currentUserId)
          .single();

        const buyerName = buyerProfile?.display_name || buyerProfile?.username || "Someone";

        await supabase.from("notifications").insert({
          user_id: transaction.seller_id,
          title: "New Pending Order",
          message: `You have a new pending order from ${buyerName} for "${transaction.listings.title}"`,
          type: "new_order",
          related_id: id
        });
      }

      // Send system message
      await supabase.from("messages").insert({
        transaction_id: id,
        sender_id: currentUserId,
        content: "Payment received. Funds are now held in escrow.",
        is_system_message: true
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment failed");
    }
  };

  const handleMarkDelivered = async () => {
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);

      const { error } = await supabase
        .from("transactions")
        .update({ 
          status: "delivered",
          delivered_at: new Date().toISOString(),
          acceptance_deadline: deadline.toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Marked as delivered!");
      fetchTransaction();

      await supabase.from("messages").insert({
        transaction_id: id,
        sender_id: currentUserId,
        content: "Seller marked the order as delivered. Buyer has 48 hours to confirm or dispute.",
        is_system_message: true
      });
    } catch (error) {
      console.error("Error marking delivered:", error);
      toast.error("Failed to mark as delivered");
    }
  };

  const handleAcceptDeal = async () => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ 
          status: "completed",
          delivery_confirmed_at: new Date().toISOString(),
          funds_released_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Deal accepted! Funds released to seller");
      setShowAcceptModal(false);
      fetchTransaction();

      await supabase.from("messages").insert({
        transaction_id: id,
        sender_id: currentUserId,
        content: "Buyer confirmed delivery. Funds have been released to the seller.",
        is_system_message: true
      });

      // Notify seller
      if (transaction) {
        await supabase.from("notifications").insert({
          user_id: transaction.seller_id,
          title: "Deal Completed",
          message: `Buyer accepted the delivery. Funds have been released!`,
          type: "completed",
          related_id: id
        });
      }
    } catch (error) {
      console.error("Error accepting deal:", error);
      toast.error("Failed to accept deal");
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeReason || !disputeDescription) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("disputes")
        .insert({
          transaction_id: id,
          opened_by: currentUserId,
          reason: disputeReason,
          description: disputeDescription,
          status: "open"
        });

      if (error) throw error;

      toast.success("Dispute opened. An admin will review your case");
      setShowDisputeModal(false);
      
      await supabase.from("messages").insert({
        transaction_id: id,
        sender_id: currentUserId,
        content: "A dispute has been opened. Funds are locked pending admin review.",
        is_system_message: true
      });
    } catch (error) {
      console.error("Error opening dispute:", error);
      toast.error("Failed to open dispute");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" />, text: "Pending Payment" },
      escrow_held: { variant: "default", icon: <Shield className="h-3 w-3" />, text: "In Escrow" },
      delivered: { variant: "default", icon: <Package className="h-3 w-3" />, text: "Delivered" },
      completed: { variant: "default", icon: <Check className="h-3 w-3" />, text: "Completed" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  if (isLoading || !transaction) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBuyer = transaction.buyer_id === currentUserId;
  const isSeller = transaction.seller_id === currentUserId;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Transaction Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{transaction.listings.title}</CardTitle>
                  {getStatusBadge(transaction.status)}
                </div>
                <p className="text-sm text-muted-foreground">{transaction.listings.game_name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Item Price</span>
                      <span className="font-medium">${transaction.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee (10%)</span>
                      <span className="font-medium">${transaction.platform_fee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${transaction.amount}</span>
                    </div>
                  </div>
                </div>

                {transaction.status === "escrow_held" && (
                  <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Funds Held in Escrow</p>
                      <p className="text-xs text-muted-foreground">Your payment is secure and will be released upon delivery confirmation</p>
                    </div>
                  </div>
                )}

                {transaction.status === "delivered" && isBuyer && (
                  <div className="bg-amber-500/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <p className="font-semibold">Buyer Acceptance Window</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{timeRemaining}</p>
                    <p className="text-xs text-muted-foreground mt-1">Time remaining to review and accept or dispute</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {transaction.status === "pending" && isBuyer && (
                    <Button onClick={handlePayment} className="flex-1">
                      <Wallet className="mr-2 h-4 w-4" />
                      Pay ${transaction.amount}
                    </Button>
                  )}

                  {transaction.status === "escrow_held" && isSeller && (
                    <Button onClick={handleMarkDelivered} className="flex-1">
                      <Package className="mr-2 h-4 w-4" />
                      Mark as Delivered
                    </Button>
                  )}

                  {transaction.status === "delivered" && isBuyer && (
                    <>
                      <Button onClick={() => setShowAcceptModal(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Check className="mr-2 h-4 w-4" />
                        Deal Accepted
                      </Button>
                      <Button onClick={() => setShowDisputeModal(true)} variant="destructive" className="flex-1">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Open Dispute
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_system_message
                          ? "bg-muted text-center text-sm italic"
                          : msg.sender_id === currentUserId
                          ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                          : "bg-muted max-w-[80%]"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>

                {transaction.status !== "completed" && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Transaction Info */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Transaction Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-semibold">{isBuyer ? "Buyer" : "Seller"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-semibold capitalize">{transaction.status.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-semibold">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                {transaction.delivered_at && (
                  <div>
                    <span className="text-muted-foreground">Delivered</span>
                    <p className="font-semibold">
                      {new Date(transaction.delivered_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Accept Deal Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deal Acceptance</DialogTitle>
            <DialogDescription>
              By clicking "Deal Accepted" you confirm that you have received access to the account and all contents as listed. Funds will be released to the seller immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptDeal} className="bg-green-600 hover:bg-green-700">
              Confirm & Release Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Dispute</DialogTitle>
            <DialogDescription>
              Please provide details about the issue. An admin will review your case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                placeholder="e.g., Account not as described"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Provide detailed information about the issue..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenDispute} variant="destructive">
              Open Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TransactionDetail;