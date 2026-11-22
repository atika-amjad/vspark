"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listRows, type QueryOptions } from "./db";
import { SUPABASE_NOT_CONFIGURED_MESSAGE, getSupabase, isSupabaseConfigured } from "./supabase";

interface State<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/** One-time fetch of a Supabase table with loading / error states. */
export function useCollection<T>(table: string, opts: QueryOptions = {}) {
  const [state, setState] = useState<State<T>>({ data: [], loading: true, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  // Serialised so the effect does not re-run on every render for the same filters.
  const filterKey = JSON.stringify(opts.eq ?? []);
  const orderKey = `${opts.orderBy ?? ""}:${opts.ascending ?? true}:${opts.limit ?? 0}`;
  const enabled = opts.enabled !== false;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!enabled) {
        setState({ data: [], loading: false, error: null });
        return;
      }
      if (!isSupabaseConfigured) {
        setState({ data: [], loading: false, error: SUPABASE_NOT_CONFIGURED_MESSAGE });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const rows = await listRows<T>(table, { ...opts, eq: JSON.parse(filterKey) });
        if (cancelled) return;
        setState({ data: rows, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        setState({ data: [], loading: false, error: `Could not load data: ${msg}` });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, tick, filterKey, orderKey, enabled]);

  // Unique per hook instance: two components can watch the same table+filter,
  // and Supabase returns the existing channel for a duplicate topic name,
  // which throws when .on() is called after subscribe().
  const channelId = useRef(Math.random().toString(36).slice(2));

  // Live updates: any insert/update/delete on the table re-runs the fetch,
  // so the admin and participant views stay in sync without a manual refresh.
  useEffect(() => {
    if (!isSupabaseConfigured || !enabled) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`realtime:${table}:${channelId.current}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, reload, enabled]);

  return { ...state, reload };
}
