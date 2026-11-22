"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { University } from "@/lib/types";

const MANUAL = "__manual__";

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  id?: string;
}

/** Loads real university data from the Hipo Labs API (via /api/universities). Falls back to manual entry on failure. */
export default function UniversityPicker({ value, onChange, error, id = "university" }: Props) {
  const [country, setCountry] = useState("Pakistan");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const [list, setList] = useState<University[]>([]);
  const [manual, setManual] = useState(false);

  const load = useCallback(async (c: string) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/universities?country=${encodeURIComponent(c)}`);
      const body = (await res.json()) as { universities?: University[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Request failed");
      const items = body.universities ?? [];
      setList(items);
      setStatus(items.length ? "ready" : "empty");
    } catch (e) {
      setList([]);
      setMessage(e instanceof Error ? e.message : "Could not reach the universities service.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load("Pakistan");
  }, [load]);

  const inList = list.some((u) => u.name === value);
  const showManual = manual || status === "error" || status === "empty";
  const selectValue = manual ? MANUAL : inList ? value : "";

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          aria-label="Country"
          className="input !py-2"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (country.trim()) void load(country.trim());
            }
          }}
          placeholder="Country, e.g. Pakistan"
        />
        <button type="button" className="btn-outline btn-sm shrink-0" onClick={() => country.trim() && load(country.trim())} disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Load
        </button>
      </div>

      {status === "loading" && <p className="text-xs text-ink-500" role="status">Loading universities from the Hipo Labs API…</p>}
      {status === "error" && (
        <p className="mb-2 text-xs text-amber-700" role="alert">
          Could not load the university list ({message}). You can type your university name below.
        </p>
      )}
      {status === "empty" && <p className="mb-2 text-xs text-amber-700">No universities were returned for “{country}”. Type your university name below.</p>}

      {status === "ready" && (
        <select
          id={id}
          className={`input ${error ? "input-error" : ""}`}
          value={selectValue}
          onChange={(e) => {
            if (e.target.value === MANUAL) {
              setManual(true);
              onChange("");
            } else {
              setManual(false);
              onChange(e.target.value);
            }
          }}
        >
          <option value="" disabled>Select University ({list.length} found)</option>
          {list.map((u, i) => (
            <option key={`${u.name}-${i}`} value={u.name}>{u.name}</option>
          ))}
          <option value={MANUAL}>My university is not listed…</option>
        </select>
      )}

      {showManual && (
        <input
          id={status === "ready" ? undefined : id}
          className={`input mt-2 ${error ? "input-error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your university name"
          maxLength={150}
        />
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
