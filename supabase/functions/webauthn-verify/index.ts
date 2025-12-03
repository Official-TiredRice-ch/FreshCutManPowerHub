// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// supabase/functions/webauthn-verify/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server";
import { isoUint8Array } from "npm:@simplewebauthn/server/helpers";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("https://hunsymrayonkonkyzvot.supabase.co")!,
      Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnN5bXJheW9ua29ua3l6dm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE0MzUzOSwiZXhwIjoyMDcyNzE5NTM5fQ.tJch6Rne2P5IIlWwP6HaEuYJfuM6-9PLP65fkE6Lbmo")! 
    );

    const body = await req.json();
    const { employeeId, credentialId, authenticatorData, clientDataJSON, signature, challenge } = body;

    // 1) Fetch user credential from DB
    const { data: credentialRecord, error: dbErr } = await supabase
      .from("biometric_credentials")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("credential_id", credentialId)
      .single();

    if (dbErr || !credentialRecord) {
      return new Response(JSON.stringify({ success: false, error: "Credential not found" }), { status: 400 });
    }

    // 2) Build WebAuthn expected parameters
    const expected = {
      challenge,
      origin: "https://your-domain.com", // IMPORTANT: put your real domain
      rpID: "your-domain.com",
    };

    // 3) Verify using @simplewebauthn/server
    const verification = await verifyAuthenticationResponse({
      response: {
        id: credentialId,
        rawId: isoUint8Array.fromBase64(credentialId),
        type: "public-key",
        response: {
          authenticatorData: isoUint8Array.fromBase64(authenticatorData),
          clientDataJSON: isoUint8Array.fromBase64(clientDataJSON),
          signature: isoUint8Array.fromBase64(signature),
        },
      },
      expectedChallenge: challenge,
      expectedOrigin: expected.origin,
      expectedRPID: expected.rpID,
      authenticator: {
        credentialID: isoUint8Array.fromBase64(credentialRecord.credential_id),
        credentialPublicKey: isoUint8Array.fromBase64(credentialRecord.public_key),
        counter: credentialRecord.sign_count,
      },
    });

    if (!verification.verified) {
      return new Response(JSON.stringify({ success: false, error: "Invalid biometric" }), { status: 400 });
    }

    // 4) Update sign count for security
    await supabase
      .from("biometric_credentials")
      .update({
        sign_count: verification.authenticationInfo.newCounter,
      })
      .eq("id", credentialRecord.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/webauthn-verify' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
