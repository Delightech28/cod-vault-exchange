import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing withdrawal for user:', user.id);

    // Parse request body
    const { amount, bank_code, account_number } = await req.json();

    if (!amount || !bank_code || !account_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, bank_code, account_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const platformFee = 50;
    const totalAmount = amount + platformFee;

    console.log(`Withdrawal request: amount=${amount}, fee=${platformFee}, total=${totalAmount}`);

    // Check user's wallet balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance, email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = profile.wallet_balance || 0;
    if (currentBalance < totalAmount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          details: `You need ₦${totalAmount.toFixed(2)} (₦${amount} + ₦${platformFee} fee) but have ₦${currentBalance.toFixed(2)}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Paystack secret key
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('Paystack secret key not configured');
      return new Response(
        JSON.stringify({ error: 'Payment provider not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create transfer recipient
    console.log('Creating transfer recipient...');
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: profile.email,
        account_number: account_number,
        bank_code: bank_code,
        currency: 'NGN',
      }),
    });

    const recipientData = await recipientResponse.json();
    console.log('Recipient response:', JSON.stringify(recipientData));

    if (!recipientResponse.ok || !recipientData.status) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create transfer recipient',
          details: recipientData.message || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipientCode = recipientData.data.recipient_code;

    // Step 2: Initiate transfer
    console.log('Initiating transfer...');
    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100, // Convert to kobo
        recipient: recipientCode,
        reason: 'Wallet withdrawal',
      }),
    });

    const transferData = await transferResponse.json();
    console.log('Transfer response:', JSON.stringify(transferData));

    if (!transferResponse.ok || !transferData.status) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initiate transfer',
          details: transferData.message || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Deduct from wallet balance
    console.log('Deducting from wallet...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: currentBalance - totalAmount })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update wallet balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Create transaction record
    console.log('Creating transaction record...');
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: amount,
        platform_fee: platformFee,
        status: 'processing',
        reference: transferData.data.reference,
        provider: 'paystack',
        currency: 'NGN',
        metadata: {
          recipient_code: recipientCode,
          transfer_code: transferData.data.transfer_code,
          bank_code: bank_code,
          account_number: account_number,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error('Failed to create transaction record:', txError);
    }

    // Step 5: Record platform fee
    if (transaction) {
      await supabase
        .from('platform_fees')
        .insert({
          user_id: user.id,
          transaction_id: transaction.id,
          amount: platformFee,
          type: 'withdrawal',
        });
    }

    // Step 6: Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Withdrawal Initiated',
        message: `Your withdrawal of ₦${amount.toFixed(2)} is being processed.`,
        type: 'withdrawal',
        related_id: transaction?.id,
      });

    console.log('Withdrawal initiated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Withdrawal initiated successfully',
        data: transferData.data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Withdrawal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
