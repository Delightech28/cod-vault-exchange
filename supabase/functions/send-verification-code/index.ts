import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    const { email, userId } = await req.json();

    if (!email || !userId) {
      throw new Error('Email and userId are required');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Save code to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('email_verification_codes')
      .insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt,
        verified: false
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save verification code');
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Account Verification <onboarding@resend.dev>",
      to: [email],
      subject: "Your Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Your verification code is:
          </p>
          <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
              ${code}
            </span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error('Failed to send verification email');
    }

    console.log(`Verification code sent to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification code sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in send-verification-code:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send verification code'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500 
      }
    );
  }
});