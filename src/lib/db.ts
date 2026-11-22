"use client";

import { getSupabase } from "./supabase";

export interface QueryOptions {
  /** Equality filters, e.g. [["userId", uid]]. */
  eq?: Array<[string, string | number | boolean]>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  /** When false the query is skipped entirely (useful for tables a signed-out visitor cannot read). */
  enabled?: boolean;
}

/** Fetches rows from a table. Errors are thrown with the Postgres message. */
export async function listRows<T>(table: string, opts: QueryOptions = {}): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = getSupabase().from(table).select("*");
  for (const [column, value] of opts.eq ?? []) query = query.eq(column, value);
  if (opts.orderBy) query = query.order(opts.orderBy, { ascending: opts.ascending ?? true });
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function getRow<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await getSupabase().from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as T) ?? null;
}

/** Inserts a row and returns its id. Content tables use text ids, so one is generated when omitted. */
export async function insertRow(table: string, values: Record<string, unknown>, id?: string): Promise<string> {
  const payload = id ? { id, ...values } : values;
  const { data, error } = await getSupabase().from(table).insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  return String((data as { id?: string } | null)?.id ?? id ?? "");
}

export async function updateRow(table: string, id: string, values: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase().from(table).update(values).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Updates by an equality column other than id (e.g. profiles.id). */
export async function updateWhere(
  table: string,
  match: [string, string | number | boolean],
  values: Record<string, unknown>,
): Promise<void> {
  const { error } = await getSupabase().from(table).update(values).eq(match[0], match[1]);
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await getSupabase().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Deletes every row matching an equality column (e.g. all members of a registration). */
export async function deleteWhere(table: string, column: string, value: string | number | boolean): Promise<void> {
  const { error } = await getSupabase().from(table).delete().eq(column, value);
  if (error) throw new Error(error.message);
}
