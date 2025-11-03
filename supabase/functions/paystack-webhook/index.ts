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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle deposit success
    if (event.event === 'charge.success') {
      return await handleDepositSuccess(event, supabase);
    }

    // Handle withdrawal success
    if (event.event === 'transfer.success') {
      return await handleTransferSuccess(event, supabase);
    }

    // Handle withdrawal failure
    if (event.event === 'transfer.failed') {
      return await handleTransferFailed(event, supabase);
    }

    return new Response('Event not processed', { status: 200 });

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

async function handleDepositSuccess(event: any, supabase: any) {
  const { reference, amount, currency, channel } = event.data;

  if (!reference) {
    throw new Error('Missing reference in webhook data');
  }

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
      message: `₦${amountInNaira.toFixed(2)} has been added to your wallet`,
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
}

async function handleTransferSuccess(event: any, supabase: any) {
  const { reference } = event.data;

  if (!reference) {
    throw new Error('Missing reference in webhook data');
  }

  // Find the withdrawal transaction
  const { data: transaction, error: findError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('reference', reference)
    .single();

  if (findError || !transaction) {
    console.error('Withdrawal transaction not found:', reference);
    throw new Error('Transaction not found');
  }

  // Check if already processed
  if (transaction.status === 'completed') {
    console.log('Withdrawal already completed:', reference);
    return new Response('Already processed', { status: 200 });
  }

  // Update transaction status to completed
  const { error: updateTxError } = await supabase
    .from('wallet_transactions')
    .update({
      status: 'completed',
      metadata: {
        ...transaction.metadata,
        transfer_data: event.data
      }
    })
    .eq('id', transaction.id);

  if (updateTxError) {
    console.error('Failed to update withdrawal transaction:', updateTxError);
    throw new Error('Failed to update transaction');
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: transaction.user_id,
      type: 'withdrawal_success',
      title: 'Withdrawal Successful',
      message: `Your withdrawal of ₦${transaction.amount.toFixed(2)} has been completed successfully.`,
      related_id: transaction.id
    });

  console.log('Withdrawal completed successfully:', {
    userId: transaction.user_id,
    amount: transaction.amount,
    reference
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTransferFailed(event: any, supabase: any) {
  const { reference } = event.data;

  if (!reference) {
    throw new Error('Missing reference in webhook data');
  }

  // Find the withdrawal transaction
  const { data: transaction, error: findError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('reference', reference)
    .single();

  if (findError || !transaction) {
    console.error('Withdrawal transaction not found:', reference);
    throw new Error('Transaction not found');
  }

  // Check if already processed
  if (transaction.status === 'failed') {
    console.log('Withdrawal already marked as failed:', reference);
    return new Response('Already processed', { status: 200 });
  }

  const totalRefund = transaction.amount + (transaction.platform_fee || 0);

  // Refund the full amount including platform fee
  const { error: refundError } = await supabase.rpc(
    'increment_wallet_balance',
    { 
      p_user_id: transaction.user_id,
      p_amount: totalRefund
    }
  );

  if (refundError) {
    console.error('Failed to refund wallet:', refundError);
    throw new Error(`Failed to refund wallet: ${refundError.message}`);
  }

  // Update transaction status to failed
  const { error: updateTxError } = await supabase
    .from('wallet_transactions')
    .update({
      status: 'failed',
      metadata: {
        ...transaction.metadata,
        transfer_data: event.data,
        refunded: true
      }
    })
    .eq('id', transaction.id);

  if (updateTxError) {
    console.error('Failed to update withdrawal transaction:', updateTxError);
    throw new Error('Failed to update transaction');
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: transaction.user_id,
      type: 'withdrawal_failed',
      title: 'Withdrawal Failed',
      message: `Your withdrawal of ₦${transaction.amount.toFixed(2)} failed. The full amount including the ₦${transaction.platform_fee} fee has been refunded to your wallet.`,
      related_id: transaction.id
    });

  console.log('Withdrawal failed and refunded:', {
    userId: transaction.user_id,
    refundAmount: totalRefund,
    reference
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
