import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase project details
const supabaseUrl = "https://hunsymrayonkonkyzvot.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnN5bXJheW9ua29ua3l6dm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDM1MzksImV4cCI6MjA3MjcxOTUzOX0.YuJPpqRBIDuM1sNpbaVOOYnpfZmBqbTtJxCOLU1qWBQ";

// Create client with proper configuration to avoid 406 errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});
