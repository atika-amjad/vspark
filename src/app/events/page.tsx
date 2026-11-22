"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import { useCollection } from "@/lib/useCollection";
import type { EventItem } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

export default function EventsPage() {
  const { data, loading, error, reload } = useCollection<EventItem>("events");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader badge="Event schedule" title="Events" subtitle="Upcoming sessions, workshops and ceremonies." />
      <div className="container-page max-w-3xl">
        <div className="mb-6 text-center"><span className="pill"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> Upcoming</span></div>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : upcoming.length === 0 ? (
          <EmptyState message="No events for this session." icon={<Calendar className="h-6 w-6" />} />
        ) : (
          <ol className="space-y-4">
            {upcoming.map((e) => (
              <li key={e.id} className="card flex gap-5 p-5 sm:p-6">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 text-white">
                  <span className="text-xs font-bold uppercase">{new Date(`${e.date}T00:00:00`).toLocaleDateString("en-GB", { month: "short" })}</span>
                  <span className="text-2xl font-extrabold leading-none">{new Date(`${e.date}T00:00:00`).getDate()}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{e.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{e.description}</p>
                  <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-ink-700">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand-600" />{formatDate(e.date)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand-600" />{e.time}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand-600" />{e.venue}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
