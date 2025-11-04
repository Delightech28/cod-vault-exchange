import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const humanityApiKey = Deno.env.get('HUMANITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!humanityApiKey) {
      throw new Error('HUMANITY_API_KEY is not configured');
    }

    // Parse query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    const userId = url.searchParams.get('user_id');

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing KYC callback for session:', sessionId, 'user:', userId);

    // Verify status from Humanity API
    const verifyResponse = await fetch(
      `https://api.humanity.org/v1/verify/status?session_id=${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${humanityApiKey}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.text();
      console.error('Humanity verify API error:', errorData);
      throw new Error(`Humanity verify API error: ${verifyResponse.status}`);
    }

    const result = await verifyResponse.json();
    
    console.log('KYC verification result:', result);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update user's KYC status if verified
    if (result.status === 'verified') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'verified',
          kyc_verified_at: new Date().toISOString(),
          is_verified_seller: true,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      console.log('Successfully updated KYC status for user:', userId);

      // Return JSON response indicating success
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'verified',
          message: 'Verification complete' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Handle pending or failed verification
      const status = result.status || 'pending';
      
      if (status === 'failed' || status === 'rejected') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            kyc_status: 'not_submitted',
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          status,
          message: `Verification ${status}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in hp-kyc-callback function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
