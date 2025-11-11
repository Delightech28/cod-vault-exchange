import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePrivyWallet = () => {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    const syncWalletAddress = async () => {
      if (!ready || !authenticated || !user) return;

      // Wait a bit for wallets to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the first available wallet (Privy creates embedded wallets automatically)
      if (wallets.length === 0) return;

      const walletAddress = wallets[0].address;

      // Get current Supabase user
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) return;

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
      }
    };

    syncWalletAddress();
  }, [ready, authenticated, user, wallets]);

  return {
    wallets,
    primaryWallet: wallets[0],
  };
};
