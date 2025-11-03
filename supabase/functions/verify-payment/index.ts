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
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    console.log('Verifying payment:', reference);

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification response:', verifyData);

    if (!verifyData.status) {
      throw new Error(verifyData.message || 'Payment verification failed');
    }

    const paymentData = verifyData.data;

    // Check transaction in our database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: transaction } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        verified: paymentData.status === 'success',
        amount: paymentData.amount / 100, // Convert from kobo to naira
        currency: paymentData.currency,
        reference: paymentData.reference,
        status: paymentData.status,
        transaction_status: transaction?.status || 'unknown',
        wallet_credited: transaction?.status === 'completed',
        paid_at: paymentData.paid_at,
        channel: paymentData.channel,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
