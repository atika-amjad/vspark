"use client";

import { useState } from "react";
import { Award, BookOpen, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { ACHIEVEMENTS, FACULTY_GROUPS, PROGRAMS } from "@/data/content";

const TABS = [
  { key: "faculty", label: "Faculty", icon: Users, items: FACULTY_GROUPS },
  { key: "programs", label: "Programs", icon: BookOpen, items: PROGRAMS },
  { key: "achievements", label: "Achievements", icon: Award, items: ACHIEVEMENTS },
] as const;

export default function DepartmentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("faculty");
  const active = TABS.find((t) => t.key === tab)!;
  return (
    <>
      <PageHeader badge="COMSATS University Islamabad · Vehari Campus" title="Computer Science" accent="Department" subtitle="Shaping the next generation of technology leaders through world-class education, research, and innovation." />
      <div className="container-page max-w-4xl">
        <div role="tablist" aria-label="Department sections" className="mb-8 flex justify-center gap-4 border-b border-slate-200 sm:gap-8">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`-mb-px flex items-center gap-2 border-b-2 px-2 pb-3 text-xs font-bold ${tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-ink-500"}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {active.items.map((i) => (
            <li key={i.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><active.icon className="h-5 w-5" /></span>
              <h2 className="mt-4 font-bold">{i.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{i.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
