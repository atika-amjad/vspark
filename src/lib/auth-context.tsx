"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "./supabase";
import type { UserProfile } from "./types";

/** Minimal user shape the UI needs (kept compatible with the old Firebase `user.uid` usage). */
export interface AppUser {
  uid: string;
  email: string | null;
}

interface AuthState {
  user: AppUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  configError: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface ProfileRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

async function loadAccess(userId: string): Promise<{ profile: UserProfile | null; isAdmin: boolean }> {
  const db = getSupabase();
  const [profileRes, adminRes] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    db.from("admins").select("userId").eq("userId", userId).maybeSingle(),
  ]);
  const row = profileRes.data as ProfileRow | null;
  const profile: UserProfile | null = row
    ? {
        uid: row.id,
        email: row.email,
        fullName: row.fullName,
        role: "participant",
        approved: Boolean(row.approved),
        createdAt: row.createdAt,
      }
    : null;
  return { profile, isAdmin: Boolean(adminRes.data) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const configError = isSupabaseConfigured ? null : SUPABASE_NOT_CONFIGURED_MESSAGE;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();

    async function apply(sessionUser: { id: string; email?: string | null } | null) {
      // While a sign-in is being applied, guards must keep showing their spinner
      // instead of treating the user as signed out and redirecting.
      setLoading(true);
      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser({ uid: sessionUser.id, email: sessionUser.email ?? null });
      const access = await loadAccess(sessionUser.id);
      setProfile(access.profile);
      setIsAdmin(access.isAdmin);
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await getSupabase().auth.getSession();
    const u = data.session?.user;
    if (!u) return;
    const access = await loadAccess(u.id);
    setProfile(access.profile);
    setIsAdmin(access.isAdmin);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, profile, isAdmin, loading, configError, refresh, signOut }),
    [user, profile, isAdmin, loading, configError, refresh, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
