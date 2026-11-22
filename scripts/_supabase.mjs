// Shared Supabase server client for the CLI scripts.
// Uses the secret key, which bypasses Row Level Security.
import { createClient } from "@supabase/supabase-js";

export function supabaseScriptClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
