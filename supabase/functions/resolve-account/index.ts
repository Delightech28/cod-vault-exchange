import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account_number, bank_code } = await req.json();

    console.log(`Resolving account: ${account_number} with bank code: ${bank_code}`);

    if (!account_number || !bank_code) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Account number and bank code are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate account number format (10 digits)
    if (!/^\d{10}$/.test(account_number)) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Account number must be 10 digits' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    // Resolve account name from Paystack
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    
    console.log('Paystack resolve response:', JSON.stringify(result));

    if (!result.status) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: result.message || 'Cannot resolve account details' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: true, 
        account_name: result.data.account_name,
        account_number: result.data.account_number,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error resolving account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to resolve account';
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
