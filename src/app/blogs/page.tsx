"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import { useCollection } from "@/lib/useCollection";
import type { BlogPost } from "@/lib/types";

type Filter = "All" | "Achievement" | "Blog Post";
const TABS: Array<{ key: Filter; label: string }> = [
  { key: "All", label: "All" },
  { key: "Achievement", label: "Achievements" },
  { key: "Blog Post", label: "Blog Posts" },
];

export default function BlogsPage() {
  const { data, loading, error, reload } = useCollection<BlogPost>("blogs");
  const [filter, setFilter] = useState<Filter>("All");
  const count = (k: Filter) => (k === "All" ? data.length : data.filter((p) => p.category === k).length);
  const posts = data.filter((p) => filter === "All" || p.category === filter).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader badge="News & updates" title="Blogs &" accent="Achievements" subtitle="Latest news, department achievements, event updates, and stories from VSpark." />
      <div className="container-page max-w-4xl">
        <div role="tablist" aria-label="Filter posts" className="mb-8 flex gap-6 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={filter === t.key} onClick={() => setFilter(t.key)} className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-xs font-bold ${filter === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-ink-500"}`}>
              {t.label}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{loading ? "…" : count(t.key)}</span>
            </button>
          ))}
        </div>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : posts.length === 0 ? (
          <EmptyState message="No posts yet." icon={<BookOpen className="h-6 w-6" />} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/blogs/${p.id}`} className="card flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:border-brand-400">
                  <span className="pill self-start">{p.category === "Achievement" ? "Achievement" : "Blog post"}</span>
                  <h2 className="mt-4 text-lg font-bold leading-snug">{p.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{p.excerpt}</p>
                  <p className="mt-4 text-xs font-medium text-ink-500">{p.author} · {p.date}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
