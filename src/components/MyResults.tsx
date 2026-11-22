"use client";

import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCollection } from "@/lib/useCollection";
import type { Registration, ResultItem } from "@/lib/types";
import { Spinner } from "./States";

/**
 * Shows the signed-in participant's own placements.
 * Results are matched to the participant through their registration number,
 * which the admin fills in when publishing a result.
 */
export default function MyResults() {
  const { user } = useAuth();
  const { data: regs, loading: regLoading } = useCollection<Registration>("registrations", { eq: [["userId", user!.uid]] });
  const { data: results, loading: resLoading } = useCollection<ResultItem>("results");

  const regNos = new Set(
    regs.map((r) => (r.regNo || "").trim().toUpperCase()).filter(Boolean),
  );
  const mine = results
    .filter((r) => r.regNo && regNos.has(r.regNo.trim().toUpperCase()))
    .sort((a, b) => String(b.year).localeCompare(String(a.year)));

  if (regLoading || resLoading) return <Spinner label="Loading your results…" />;
  if (mine.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Trophy className="h-5 w-5 text-brand-600" /> My results
      </h2>
      <ul className="space-y-3">
        {mine.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-bold">{r.competition}</p>
              <p className="text-xs text-ink-500">{r.winner} · {r.university} · {r.year}</p>
            </div>
            <span className={`rounded-xl px-3 py-1.5 text-sm font-extrabold ${r.position === "1st" ? "bg-amber-100 text-amber-800" : "bg-brand-50 text-brand-700"}`}>
              {r.position} position
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
