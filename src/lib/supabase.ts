"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see README).";

/**
 * Sessions live in sessionStorage, not localStorage: closing the tab or opening a
 * new one requires signing in again, while a refresh in the same tab stays signed in.
 */
const tabSessionStore = {
  getItem(keyName: string): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(keyName);
  },
  setItem(keyName: string, value: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(keyName, value);
  },
  removeItem(keyName: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(keyName);
  },
};

let client: SupabaseClient | null = null;

/** Lazily created so pages can be pre-rendered at build time without credentials. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: tabSessionStore,
        flowType: "pkce",
      },
    });
  }
  return client;
}

/** Returns the current access token, or throws. Used by the proof upload/read API calls. */
export async function requireAccessToken(): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session) throw new Error("You must be signed in.");
  return data.session.access_token;
}
