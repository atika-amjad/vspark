"use client";

import { useState } from "react";
import { Image as ImageIcon, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import { GALLERY } from "@/data/content";
import { useCollection } from "@/lib/useCollection";
import type { ResultItem } from "@/lib/types";

function Results() {
  const { data, loading, error, reload } = useCollection<ResultItem>("results");
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (data.length === 0) return <EmptyState message="Results will be published after the competitions finish." icon={<Trophy className="h-6 w-6" />} />;
  const sorted = [...data].sort((a, b) => b.year.localeCompare(a.year) || a.competition.localeCompare(b.competition) || a.position.localeCompare(b.position));
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-ink-500">
          <tr><th className="px-4 py-3">Year</th><th className="px-4 py-3">Competition</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Winner</th><th className="px-4 py-3">University</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">{r.year}</td>
              <td className="px-4 py-3 font-semibold">{r.competition}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">{r.position}</span></td>
              <td className="px-4 py-3">{r.winner}</td>
              <td className="px-4 py-3 text-ink-500">{r.university}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HighlightsPage() {
  const [tab, setTab] = useState<"gallery" | "results">("gallery");
  const tabCls = (active: boolean) => `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-700"}`;
  return (
    <>
      <PageHeader badge="Gallery & results" title="Event" accent="Highlights & Results" subtitle="Relive the best moments from past VSpark events — the energy, the competition, the winners." />
      <div className="container-page max-w-5xl">
        <div role="tablist" aria-label="Highlights" className="mb-8 flex justify-center gap-3">
          <button role="tab" aria-selected={tab === "gallery"} className={tabCls(tab === "gallery")} onClick={() => setTab("gallery")}><ImageIcon className="h-3.5 w-3.5" /> Photos &amp; Gallery</button>
          <button role="tab" aria-selected={tab === "results"} className={tabCls(tab === "results")} onClick={() => setTab("results")}><Trophy className="h-3.5 w-3.5" /> Competition Results</button>
        </div>
        {tab === "gallery" ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {GALLERY.map((g) => (
              <li key={g.src} className="group relative overflow-hidden rounded-2xl shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-semibold text-white">{g.caption}</span>
              </li>
            ))}
          </ul>
        ) : <Results />}
      </div>
    </>
  );
}
