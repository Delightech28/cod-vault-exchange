import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { amount, currency, provider } = await req.json();

    console.log('Payment initialization request:', { userId: user.id, amount, currency, provider });

    // Validate input
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (provider === 'paystack') {
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        throw new Error('Paystack not configured');
      }

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      const email = profile?.email || user.email;
      const reference = `wallet_${user.id}_${Date.now()}`;

      // Paystack primarily supports NGN - force NGN for all Paystack transactions
      const paystackCurrency = 'NGN';
      const amountInKobo = Math.round(amount * 100); // Convert to kobo

      console.log('Initializing Paystack transaction:', { email, amount, amountInKobo, currency: paystackCurrency, reference });

      // Initialize Paystack transaction
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: paystackCurrency,
          reference,
          callback_url: `https://tradeopsmk.vercel.app/wallet?payment=success&reference=${reference}`,
          metadata: {
            user_id: user.id,
            full_name: profile?.full_name || '',
            cancel_action: 'https://tradeopsmk.vercel.app/wallet?payment=cancelled',
            custom_fields: [
              {
                display_name: "User ID",
                variable_name: "user_id",
                value: user.id
              }
            ]
          },
          channels: ['card', 'bank', 'ussd', 'bank_transfer']
        }),
      });

      const paystackData = await paystackResponse.json();
      console.log('Paystack response:', paystackData);

      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

      // Create wallet transaction record
      const { error: insertError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          currency: paystackCurrency,
          provider: 'paystack',
          reference,
          status: 'pending',
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
          metadata: {
            authorization_url: paystackData.data.authorization_url,
            original_currency: currency
          }
        });

      if (insertError) {
        console.error('Failed to create transaction record:', insertError);
        throw new Error('Failed to create transaction record');
      }

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'paystack',
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stripe will be implemented later
    if (provider === 'stripe') {
      throw new Error('Stripe integration coming soon');
    }

    throw new Error('Invalid payment provider');

  } catch (error) {
    console.error('Error in initialize-payment:', error);
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
