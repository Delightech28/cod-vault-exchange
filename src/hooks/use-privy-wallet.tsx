import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePrivyWallet = () => {
  const { ready, authenticated, user, login, createWallet } = usePrivy();
  const { wallets } = useWallets();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const syncWalletAddress = async () => {
      if (!ready) {
        console.log('Privy not ready yet');
        return;
      }

      // Get current Supabase user first
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) {
        console.log('No Supabase user found');
        setWalletError(null); // Clear error if not logged in
        return;
      }

      // Check if wallets are available
      console.log('Wallets available:', wallets.length);
      
      if (wallets.length === 0) {
        // Try to create an embedded wallet
        try {
          setIsCreatingWallet(true);
          console.log('Creating embedded wallet...');
          await createWallet();
          setWalletError(null);
        } catch (error) {
          console.error('Failed to create wallet:', error);
          setWalletError('Unable to create wallet. Please try refreshing the page.');
        } finally {
          setIsCreatingWallet(false);
        }
        return;
      }

      const walletAddress = wallets[0].address;
      console.log('Syncing wallet address:', walletAddress);

      // Update wallet address in profile
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress } as any)
        .eq('user_id', supabaseUser.id);

      if (error) {
        console.error('Error updating wallet address:', error);
        toast({
          title: 'Wallet sync failed',
          description: 'Failed to sync wallet address to profile',
          variant: 'destructive',
        });
        setWalletError('Failed to sync wallet');
      } else {
        console.log('Wallet address synced successfully');
        setWalletError(null);
      }
    };

    syncWalletAddress();
  }, [ready, wallets, createWallet]);

  return {
    wallets,
    primaryWallet: wallets[0],
    isLoading: !ready || isCreatingWallet,
    isAuthenticated: authenticated,
    walletError,
    login,
  };
};
