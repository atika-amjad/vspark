"use client";

import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    async function run() {
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
  }, [table, tick, filterKey, orderKey]);

  // Live updates: any insert/update/delete on the table re-runs the fetch,
  // so the admin and participant views stay in sync without a manual refresh.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`realtime:${table}:${filterKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, filterKey, reload]);

  return { ...state, reload };
}
