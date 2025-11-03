import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Wallet, Plus, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    amount: number;
    listings: {
      title: string;
      game_name: string;
    };
    seller_id: string;
  };
  userCountry: string | null;
  onPaymentSuccess: () => void;
}

export function PaymentConfirmationModal({
  open,
  onOpenChange,
  transaction,
  userCountry,
  onPaymentSuccess,
}: PaymentConfirmationModalProps) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [sellerUsername, setSellerUsername] = useState("Seller");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "add-funds">("wallet");
  const [agreedToEscrow, setAgreedToEscrow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    if (open) {
      fetchWalletBalance();
      fetchSellerInfo();
      getCurrentUser();
    }
  }, [open, transaction.seller_id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchWalletBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setWalletBalance(Number(profile.wallet_balance) || 0);
    }
  };

  const fetchSellerInfo = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, display_name, full_name")
        .eq("user_id", transaction.seller_id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching seller:", error);
        return;
      }

      if (profile) {
        setSellerUsername(profile.display_name || profile.full_name || profile.username || "Seller");
      }
    } catch (err) {
      console.error("Fetch seller error:", err);
    }
  };

  const hasInsufficientBalance = walletBalance < transaction.amount;

  const handleConfirmPayment = async () => {
    if (!agreedToEscrow) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === "wallet") {
        // Deduct from wallet
        const { error: walletError } = await supabase
          .from("profiles")
          .update({
            wallet_balance: walletBalance - transaction.amount
          })
          .eq("user_id", currentUserId);

        if (walletError) throw walletError;
      }

      // Update transaction status
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          status: "escrow_held",
          escrow_held_at: new Date().toISOString()
        })
        .eq("id", transaction.id);

      if (txError) throw txError;

      // Send system message
      await supabase.from("messages").insert({
        transaction_id: transaction.id,
        sender_id: currentUserId,
        content: "Payment received. Funds are now held in escrow.",
        is_system_message: true
      });

      // Notify seller
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
        related_id: transaction.id
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsProcessing(false);
        onOpenChange(false);
        onPaymentSuccess();
        // Reset state
        setAgreedToEscrow(false);
        setPaymentMethod("wallet");
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
    }
  };

  const handleAddFunds = () => {
    // Navigate to add funds flow
    window.location.href = "/wallet";
  };

  // Processing modal
  if (isProcessing && !showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing payment...</h3>
            <p className="text-sm text-muted-foreground text-center">
              Do not close this window. Your funds will be moved into secure escrow.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success modal
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Successful</h3>
            <p className="text-sm text-muted-foreground text-center">
              Funds are now held in escrow. You can now message the seller or wait for delivery.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main confirmation modal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Your Purchase</DialogTitle>
          <DialogDescription>
            Review your purchase details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{transaction.listings.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Game:</span>
              <span className="font-medium">{transaction.listings.game_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seller: {sellerUsername}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Amount:</span>
              <span>{formatPrice(transaction.amount, userCountry)}</span>
            </div>
          </div>

          {/* Escrow Details */}
          <div className="bg-primary/10 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Escrow Details</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>🔒 Your payment will be securely held in escrow by our platform.</li>
                  <li>The seller will <strong>not</strong> receive funds until you confirm delivery or the 48-hour timer ends.</li>
                  <li>If a dispute is opened, funds remain locked until resolved.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {!hasInsufficientBalance && (
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>Pay from Wallet</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Balance: ₦{walletBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="add-funds" id="add-funds" />
                  <Label htmlFor="add-funds" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Funds → Pay {formatPrice(transaction.amount, userCountry)}</span>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                    Insufficient Balance
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    You need ₦{(transaction.amount - walletBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} more to complete this payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Agreement Checkbox */}
          {!hasInsufficientBalance && (
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="escrow-agreement"
                checked={agreedToEscrow}
                onCheckedChange={(checked) => setAgreedToEscrow(checked as boolean)}
              />
              <Label
                htmlFor="escrow-agreement"
                className="text-sm leading-tight cursor-pointer"
              >
                I understand this payment will be held in escrow until I confirm delivery or a dispute is resolved.
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          {hasInsufficientBalance ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds}>
                <Plus className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={paymentMethod === "add-funds" ? handleAddFunds : handleConfirmPayment}
                disabled={!agreedToEscrow}
              >
                {paymentMethod === "add-funds" ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Funds
                  </>
                ) : (
                  <>
                    Confirm & Pay {formatPrice(transaction.amount, userCountry)}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
