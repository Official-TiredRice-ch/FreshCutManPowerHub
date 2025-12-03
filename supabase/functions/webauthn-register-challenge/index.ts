import { serve } from "https://deno.land/std/http/server.ts";
import {
  generateRegistrationOptions,
} from "npm:@simplewebauthn/server";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { userId, username } = await req.json();

  const options = await generateRegistrationOptions({
    rpName: "Freshcut Hub",
    rpID: "freshcutmanpowerhub.onrender.com",
    userID: userId.toString(),
    userName: username,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
  });

  return new Response(
    JSON.stringify(options),
    { headers: { "Content-Type": "application/json" } }
  );
});
