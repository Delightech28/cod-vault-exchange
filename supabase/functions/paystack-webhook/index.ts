import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Verify Paystack signature
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event, event.data?.reference);

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      return new Response('Event not processed', { status: 200 });
    }

    const { reference, amount, currency, channel, metadata } = event.data;

    if (!reference) {
      throw new Error('Missing reference in webhook data');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the transaction
    const { data: transaction, error: findError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found:', reference);
      throw new Error('Transaction not found');
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      console.log('Transaction already completed:', reference);
      return new Response('Already processed', { status: 200 });
    }

    const amountInNaira = amount / 100; // Convert from kobo to naira

    // Update transaction status
    const { error: updateTxError } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        payment_method: channel,
        metadata: {
          ...transaction.metadata,
          payment_data: event.data
        }
      })
      .eq('id', transaction.id);

    if (updateTxError) {
      console.error('Failed to update transaction:', updateTxError);
      throw new Error('Failed to update transaction');
    }

    // Credit user's wallet using transaction-safe function
    const { error: updateBalanceError } = await supabase.rpc(
      'increment_wallet_balance',
      { 
        p_user_id: transaction.user_id,
        p_amount: amountInNaira
      }
    );

    if (updateBalanceError) {
      console.error('Failed to credit wallet:', updateBalanceError);
      throw new Error(`Failed to credit wallet: ${updateBalanceError.message}`);
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.user_id,
        type: 'payment_success',
        title: 'Funds Added Successfully',
        message: `${currency}${amountInNaira.toFixed(2)} has been added to your wallet`,
        related_id: transaction.id
      });

    console.log('Wallet credited successfully:', {
      userId: transaction.user_id,
      amount: amountInNaira,
      reference
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paystack-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
