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
    console.log('Fetching Nigerian banks from Paystack...');
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    // Fetch banks from Paystack
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error('Failed to fetch banks from Paystack');
    }

    // Filter for Nigerian banks only
    const nigerianBanks = result.data
      .filter((bank: any) => bank.currency === 'NGN')
      .map((bank: any) => ({
        name: bank.name,
        code: bank.code,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    console.log(`Fetched ${nigerianBanks.length} Nigerian banks`);

    return new Response(
      JSON.stringify({ 
        status: true, 
        data: nigerianBanks 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching banks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch banks';
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
