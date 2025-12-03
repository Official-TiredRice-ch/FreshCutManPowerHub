// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/webauthn-auth-challenge/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std/http/server.ts";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { employeeId } = await req.json();

    if (!employeeId) {
      return new Response(JSON.stringify({ error: "Missing employeeId" }), {
        status: 400,
      });
    }

    const { data: creds, error } = await supabase
      .from("biometric_credentials")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (error || !creds) {
      return new Response(JSON.stringify({ error: "No credentials found" }), {
        status: 404,
      });
    }

    const credentialIdBytes = Uint8Array.from(
      atob(creds.credential_id),
      (c) => c.charCodeAt(0)
    );

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      allowCredentials: [
        {
          id: credentialIdBytes,
          type: "public-key",
        },
      ],
      userVerification: "preferred",
      rpID: "freshcutmanpowerhub.onrender.com",
    });

    await supabase
      .from("biometric_credentials")
      .update({ current_challenge: options.challenge })
      .eq("employee_id", employeeId);

    return new Response(JSON.stringify(options), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
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
