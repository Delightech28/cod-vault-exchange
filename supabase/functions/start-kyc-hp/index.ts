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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the origin from the request for redirect URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    
    if (!origin) {
      throw new Error('Could not determine origin for redirect URL');
    }

    console.log('Starting KYC for user:', user.id);

    // Call Humanity Protocol API to start verification session
    const response = await fetch('https://api.humanity.org/v1/verify/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${humanityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        redirect_url: `${origin}/kyc/callback`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Humanity API error:', errorData);
      throw new Error(`Humanity API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    console.log('KYC session started successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        verification_url: data.verification_url,
        session_id: data.session_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-kyc-hp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
