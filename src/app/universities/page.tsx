"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import type { University } from "@/lib/types";

export default function UniversitiesPage() {
  const [country, setCountry] = useState("Pakistan");
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<University[]>([]);

  const search = useCallback(async (c: string, n: string) => {
    if (!c.trim() && !n.trim()) {
      setMessage("Enter a country or a university name.");
      setState("error");
      return;
    }
    setState("loading");
    try {
      const qs = new URLSearchParams();
      if (c.trim()) qs.set("country", c.trim());
      if (n.trim()) qs.set("name", n.trim());
      const res = await fetch(`/api/universities?${qs.toString()}`);
      const body = (await res.json()) as { universities?: University[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Request failed");
      setItems(body.universities ?? []);
      setState("ready");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const networkFailure = !raw || /failed to fetch|networkerror|load failed|fetch failed/i.test(raw);
      setMessage(
        networkFailure
          ? "Could not reach the universities service. Check your connection and try again — or enter your university manually on the registration form."
          : raw,
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void search("Pakistan", "");
  }, [search]);

  return (
    <>
      <PageHeader badge="Live data · Hipo Labs API" title="Participating" accent="Universities" subtitle="Browse universities fetched live from the Hipo Labs Universities API. The same data powers the university selector on the registration form." />
      <div className="container-page max-w-5xl">
        <form onSubmit={(e) => { e.preventDefault(); void search(country, name); }} className="mb-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div><label htmlFor="country" className="label">Country</label><input id="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pakistan" /></div>
          <div><label htmlFor="uname" className="label">University name (optional)</label><input id="uname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. COMSATS" /></div>
          <button type="submit" className="btn-primary self-end" disabled={state === "loading"}>
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </button>
        </form>

        {state === "loading" && <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-ink-500"><Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Fetching universities…</p>}
        {state === "error" && <ErrorState message={message} onRetry={() => search(country, name)} />}
        {state === "ready" && items.length === 0 && <EmptyState message="No universities matched your search." />}
        {state === "ready" && items.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-500">{items.length} result{items.length === 1 ? "" : "s"}{items.length === 300 ? " (showing the first 300)" : ""}</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((u, i) => (
                <li key={`${u.name}-${i}`} className="card p-5">
                  <h2 className="font-bold leading-snug">{u.name}</h2>
                  <p className="mt-1 text-xs text-ink-500">{u.country}{u.alphaTwoCode ? ` (${u.alphaTwoCode})` : ""}{u.stateProvince ? ` · ${u.stateProvince}` : ""}</p>
                  {u.webPages[0] && (
                    <a href={u.webPages[0]} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                      Visit website <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
