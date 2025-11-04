import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import AccountDetails from "./pages/AccountDetails";
import SellAccount from "./pages/SellAccount";
import HowItWorks from "./pages/HowItWorks";
import Support from "./pages/Support";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import Notifications from "./pages/Notifications";
import MyListings from "./pages/MyListings";
import Messages from "./pages/Messages";
import AdminDisputes from "./pages/AdminDisputes";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import NotFound from "./pages/NotFound";
import KycCallback from "./pages/KycCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/account/:id" element={<AccountDetails />} />
          <Route path="/sell" element={<SellAccount />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/support" element={<Support />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transaction/:id" element={<TransactionDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/kyc/callback" element={<KycCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
