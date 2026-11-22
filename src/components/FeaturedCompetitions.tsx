"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCollection } from "@/lib/useCollection";
import type { Competition } from "@/lib/types";
import { EmptyState, ErrorState, Spinner } from "./States";

export default function FeaturedCompetitions() {
  const { data, loading, error, reload } = useCollection<Competition>("competitions");
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (data.length === 0) return <EmptyState message="Competitions will be announced soon. Check back later!" />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.slice(0, 3).map((c) => (
        <article key={c.id} className="card flex flex-col p-6">
          <span className="pill self-start">{c.category}</span>
          <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-500">{c.description}</p>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-bold text-brand-600">{c.fee > 0 ? `PKR ${c.fee}` : "Free"}</span>
            <Link href="/competitions" className="inline-flex items-center gap-1 font-semibold">Details <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </article>
      ))}
    </div>
  );
}
