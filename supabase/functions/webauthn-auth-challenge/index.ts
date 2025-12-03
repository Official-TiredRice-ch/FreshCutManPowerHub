// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/webauthn-auth-challenge/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import {
  generateAuthenticationOptions,
} from "npm:@simplewebauthn/server";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function base64urlToUint8Array(base64url: string) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      });
    }


    const { data: creds, error } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !creds) {
      return new Response(
        JSON.stringify({ error: "No stored WebAuthn credentials" }),
        { status: 404 }
      );
    }

    // Convert base64url credential ID → Uint8Array
    const credentialID = base64urlToUint8Array(creds.credential_id);

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      rpID: "freshcutmanpowerhub.onrender.com", 
      allowCredentials: [
        {
          id: credentialID,
          type: "public-key",
        },
      ],
      userVerification: "preferred",
    });

    // Store challenge
    await supabase
      .from("webauthn_credentials")
      .update({ current_challenge: options.challenge })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        challenge: options.challenge,
        credentialId: creds.credential_id, // stored key
        allowCredentials: options.allowCredentials,
        rpID: options.rpID,
        userVerification: options.userVerification,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/webauthn-auth-challenge' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
