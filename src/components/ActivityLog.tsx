"use client";

import { History } from "lucide-react";
import { useCollection } from "@/lib/useCollection";
import { EmptyState, Spinner } from "./States";

export interface ActivityRow {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  label: string;
  createdAt: string;
}

function formatAction(action: string): { text: string; tone: string } {
  if (action.endsWith(".approved")) return { text: "Approved", tone: "bg-emerald-100 text-emerald-800" };
  if (action.endsWith(".rejected")) return { text: "Rejected", tone: "bg-red-100 text-red-800" };
  if (action.endsWith(".deleted")) return { text: "Deleted", tone: "bg-red-100 text-red-800" };
  if (action.endsWith(".created")) return { text: "Created", tone: "bg-emerald-100 text-emerald-800" };
  if (action.endsWith(".pending")) return { text: "Set pending", tone: "bg-amber-100 text-amber-800" };
  return { text: "Updated", tone: "bg-slate-100 text-slate-700" };
}

/** Audit trail of every admin action, written by database triggers. */
export default function ActivityLog() {
  const { data, loading, error, reload } = useCollection<ActivityRow>("activity_log", { orderBy: "createdAt", ascending: false, limit: 200 });

  if (loading) return <Spinner label="Loading history…" />;
  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (data.length === 0) return <EmptyState message="No activity recorded yet. Approve a registration or add an event and it will appear here." />;

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
      {data.map((row) => {
        const a = formatAction(row.action);
        return (
          <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${a.tone}`}>{a.text}</span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{row.label || row.entityId || row.entity}</span>
              <span className="text-ink-500"> · {row.entity}</span>
            </span>
            <span className="text-xs text-ink-500">{row.actorEmail || "system"}</span>
            <span className="text-xs text-ink-400">{new Date(row.createdAt).toLocaleString()}</span>
          </li>
        );
      })}
      <li className="flex items-center gap-2 px-4 py-3 text-xs text-ink-500">
        <History className="h-3.5 w-3.5" /> Showing the latest {data.length} actions
        <button onClick={reload} className="ml-auto font-semibold text-brand-600">Refresh</button>
      </li>
    </ul>
  );
}
