import { createClient } from "@supabase/supabase-js";

// Browser/anon client — used by client components and server components that
// only read public (RLS-guarded) data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.",
    );
  }
  return createClient(url, anonKey);
}
