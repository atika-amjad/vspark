import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export const PROOF_BUCKET = process.env.SUPABASE_BUCKET || "payment-proofs";

/**
 * Server-only client using the secret key. Never import this from a client component.
 * `auth.persistSession: false` keeps it stateless per request.
 */
export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).");
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface VerifiedCaller {
  uid: string;
  isAdmin: boolean;
}

/**
 * Verifies the Supabase access token from the Authorization header and checks the admins table.
 * Uses the secret key, so this also works for accounts whose profile row is missing.
 */
export async function verifyCaller(request: Request): Promise<VerifiedCaller> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Missing authentication token.");

  const client = supabaseAdmin();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Invalid or expired authentication token.");
  const uid = data.user.id;

  const { data: adminRow } = await client.from("admins").select("userId").eq("userId", uid).maybeSingle();
  return { uid, isAdmin: Boolean(adminRow) };
}
