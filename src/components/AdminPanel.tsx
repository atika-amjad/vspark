"use client";

import { useState } from "react";
import AdminRegistrations from "./AdminRegistrations";
import ActivityLog from "./ActivityLog";
import CrudManager, { type FieldDef } from "./CrudManager";

const COMPETITION_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", max: 80 },
  { name: "category", label: "Category", type: "text", placeholder: "Programming", max: 40 },
  { name: "description", label: "Description", type: "textarea", max: 600 },
  { name: "fee", label: "Registration fee (PKR)", type: "number" },
  { name: "prize", label: "Prize", type: "text", max: 120 },
  { name: "teamSize", label: "Team size (display text)", type: "text", placeholder: "Individual / Teams of 2", max: 60 },
  { name: "maxTeamSize", label: "Max team size (1 = individual)", type: "number" },
  { name: "venue", label: "Venue", type: "text", max: 120 },
];
const EVENT_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", max: 100 },
  { name: "description", label: "Description", type: "textarea", max: 600 },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "text", placeholder: "10:00 AM – 1:00 PM", max: 40 },
  { name: "venue", label: "Venue", type: "text", max: 120 },
];
const BLOG_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", max: 140 },
  { name: "category", label: "Category", type: "select", options: ["Blog Post", "Achievement"] },
  { name: "excerpt", label: "Excerpt", type: "textarea", max: 280 },
  { name: "content", label: "Content (blank line = new paragraph)", type: "textarea", max: 10000 },
  { name: "author", label: "Author", type: "text", max: 80 },
  { name: "date", label: "Date", type: "date" },
];
const RESULT_FIELDS: FieldDef[] = [
  { name: "year", label: "Year", type: "text", placeholder: "2025", max: 4 },
  { name: "competition", label: "Competition", type: "text", max: 80 },
  { name: "position", label: "Position", type: "select", options: ["1st", "2nd", "3rd"] },
  { name: "winner", label: "Winner / team", type: "text", max: 100 },
  { name: "university", label: "University", type: "text", max: 120 },
  { name: "regNo", label: "Winner registration no. (optional — lets the participant see this on their dashboard)", type: "text", placeholder: "FA23-BSE-001", max: 30, required: false },
];

const TABS = ["Registrations", "Competitions", "Events", "Blogs", "Results", "History"] as const;
type Tab = (typeof TABS)[number];

/** Admin-only content management, shown inside the unified dashboard. */
export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("Registrations");
  return (
    <div className="container-page max-w-4xl">
      <div role="tablist" aria-label="Admin sections" className="mb-6 flex gap-5 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-bold ${tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-ink-500"}`}>{t}</button>
        ))}
      </div>
      {tab === "Registrations" && <AdminRegistrations />}
      {tab === "Competitions" && <CrudManager key="c" collectionName="competitions" singular="Competition" fields={COMPETITION_FIELDS} summary={(r) => ({ title: String(r.title), subtitle: `${r.category} · PKR ${r.fee}` })} />}
      {tab === "Events" && <CrudManager key="e" collectionName="events" singular="Event" fields={EVENT_FIELDS} sortBy="date" summary={(r) => ({ title: String(r.title), subtitle: `${r.date} · ${r.venue}` })} />}
      {tab === "Blogs" && <CrudManager key="b" collectionName="blogs" singular="Post" fields={BLOG_FIELDS} sortBy="date" summary={(r) => ({ title: String(r.title), subtitle: `${r.category} · ${r.date}` })} />}
      {tab === "Results" && <CrudManager key="r" collectionName="results" singular="Result" fields={RESULT_FIELDS} sortBy="year" summary={(r) => ({ title: `${r.competition} — ${r.position}`, subtitle: `${r.winner} · ${r.year}` })} />}
      {tab === "History" && <ActivityLog />}
    </div>
  );
}
