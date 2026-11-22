"use client";

import Link from "next/link";
import { MapPin, Trophy, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import { useAuth } from "@/lib/auth-context";
import { useCollection } from "@/lib/useCollection";
import type { Competition } from "@/lib/types";

export default function CompetitionsPage() {
  const { data, loading, error, reload } = useCollection<Competition>("competitions");
  const { user, profile } = useAuth();

  function registerHref(id: string) {
    if (!user) return `/register?competition=${id}`;
    return profile?.approved ? `/dashboard/new?competition=${id}` : "/dashboard";
  }

  return (
    <>
      <PageHeader
        badge="All competitions"
        title="Competitions"
        subtitle={loading || error ? "Each with prizes, registration fees, and internship opportunities. You can register for multiple competitions." : `${data.length} competitions — each with prizes, registration fees, and internship opportunities. You can register for multiple competitions.`}
      />
      <div className="container-page">
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState message="Competitions will be announced soon. Check back later!" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((c) => (
              <article key={c.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="pill">{c.category}</span>
                    <h2 className="mt-3 text-xl font-bold">{c.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-extrabold text-brand-700">{c.fee > 0 ? `PKR ${c.fee}` : "Free"}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{c.description}</p>
                <dl className="mt-5 grid gap-2 text-sm text-ink-700">
                  <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-brand-600" /><dt className="sr-only">Prize</dt><dd>{c.prize}</dd></div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-600" /><dt className="sr-only">Team size</dt><dd>{c.teamSize}</dd></div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-600" /><dt className="sr-only">Venue</dt><dd>{c.venue}</dd></div>
                </dl>
                <Link href={registerHref(c.id)} className="btn-primary mt-6">Register for this competition</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
