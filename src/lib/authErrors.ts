"use client";

import { getSupabase } from "./supabase";

/** Maps Supabase auth errors onto the messages the UI already shows. */
export function authErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
  if (lower.includes("email not confirmed")) return "Please confirm your email address, then log in.";
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("password should be at least")) return "Password is too short.";
  if (lower.includes("unable to validate email") || lower.includes("invalid email")) return "Enter a valid email address.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (lower.includes("network")) return "Network error. Check your connection and try again.";
  if (lower.includes("not configured")) return message;
  return message || "Something went wrong. Please try again.";
}

/** Signs the current user out (used after self-registration). */
export async function signOutNow(): Promise<void> {
  await getSupabase().auth.signOut();
}
