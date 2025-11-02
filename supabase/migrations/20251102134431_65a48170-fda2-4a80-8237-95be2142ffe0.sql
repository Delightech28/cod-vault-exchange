-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for listing status
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending_verification', 'approved', 'rejected', 'sold', 'removed');

-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'escrow_held', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled');

-- Create enum for dispute status
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed');

-- Create enum for KYC status
CREATE TYPE public.kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected', 'expired');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  kyc_status public.kyc_status DEFAULT 'not_submitted',
  kyc_verified_at TIMESTAMPTZ,
  is_verified_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KYC documents table (stores references to encrypted files)
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'id_front', 'id_back', 'selfie', 'proof_of_address'
  file_path TEXT NOT NULL, -- encrypted storage path
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  status public.kyc_status DEFAULT 'pending',
  rejection_reason TEXT
);

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  level INTEGER,
  rank TEXT,
  items_included TEXT[],
  screenshots TEXT[], -- array of storage paths
  proof_documents TEXT[], -- array of storage paths
  status public.listing_status DEFAULT 'draft',
  status_reason TEXT, -- rejection or removal reason
  requires_verification BOOLEAN DEFAULT false, -- true if price > threshold
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions/Orders table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  platform_fee DECIMAL(10,2) DEFAULT 0,
  seller_payout DECIMAL(10,2),
  payment_intent_id TEXT, -- Stripe payment intent ID (for later)
  escrow_held_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_confirmed_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ, -- 48 hours after delivery
  funds_released_at TIMESTAMPTZ,
  status public.transaction_status DEFAULT 'pending',
  buyer_ip TEXT,
  seller_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_files TEXT[], -- array of storage paths
  status public.dispute_status DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id), -- admin/moderator
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_outcome TEXT, -- 'refund_buyer' or 'release_seller'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs table (immutable)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'listing', 'transaction', 'dispute', 'kyc', etc.
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fraud tracking table
CREATE TABLE public.fraud_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  suspicious_activity TEXT,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  is_fraud BOOLEAN
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_tracking ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()));

-- RLS Policies for kyc_documents
CREATE POLICY "Users can view their own KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admins can update KYC documents"
  ON public.kyc_documents FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()));

-- RLS Policies for listings
CREATE POLICY "Anyone can view approved listings"
  ON public.listings FOR SELECT
  USING (status = 'approved' OR auth.uid() = seller_id OR public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Sellers can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = seller_id AND status IN ('draft', 'rejected'));

CREATE POLICY "Admins can update any listing"
  ON public.listings FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()));

-- RLS Policies for transactions
CREATE POLICY "Buyers and sellers can view their transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Buyers can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin_or_moderator(auth.uid()));

-- RLS Policies for disputes
CREATE POLICY "Dispute participants can view disputes"
  ON public.disputes FOR SELECT
  USING (
    auth.uid() = opened_by 
    OR auth.uid() IN (SELECT buyer_id FROM public.transactions WHERE id = transaction_id)
    OR auth.uid() IN (SELECT seller_id FROM public.transactions WHERE id = transaction_id)
    OR public.is_admin_or_moderator(auth.uid())
  );

CREATE POLICY "Transaction participants can create disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT buyer_id FROM public.transactions WHERE id = transaction_id)
    OR auth.uid() IN (SELECT seller_id FROM public.transactions WHERE id = transaction_id)
  );

CREATE POLICY "Admins can update disputes"
  ON public.disputes FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()));

-- RLS Policies for audit_logs (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fraud_tracking
CREATE POLICY "Admins can view fraud tracking"
  ON public.fraud_tracking FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admins can manage fraud tracking"
  ON public.fraud_tracking FOR ALL
  USING (public.is_admin_or_moderator(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_disputes_transaction_id ON public.disputes(transaction_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_fraud_tracking_ip ON public.fraud_tracking(ip_address);
CREATE INDEX idx_fraud_tracking_email ON public.fraud_tracking(email);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();