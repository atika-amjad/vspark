"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { useCollection } from "@/lib/useCollection";
import type { EventItem } from "@/lib/types";
import { Spinner } from "./States";

/** Upcoming events created by the admin, shown on the participant dashboard. */
export default function UpcomingEvents() {
  const { data, loading } = useCollection<EventItem>("events", { orderBy: "date" });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.filter((e) => e.date && e.date >= today).slice(0, 3);

  if (loading) return <Spinner label="Loading events…" />;
  if (upcoming.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CalendarDays className="h-5 w-5 text-brand-600" /> Upcoming events
        </h2>
        <Link href="/events" className="text-sm font-semibold text-brand-600">View all →</Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {upcoming.map((e) => (
          <li key={e.id} className="card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{e.date}</p>
            <p className="mt-1 font-bold">{e.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-ink-500">{e.description}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-ink-700"><MapPin className="h-3 w-3" /> {e.venue}</p>
            {e.time && <p className="text-xs text-ink-500">{e.time}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
