"use client";

import { Users } from "lucide-react";
import { useCollection } from "@/lib/useCollection";
import type { TeamMember } from "@/lib/types";

/** Read-only list of a registration's teammates. */
export default function MemberList({ registrationId }: { registrationId: string }) {
  const { data, loading } = useCollection<TeamMember>("team_members", {
    eq: [["registrationId", registrationId]],
    orderBy: "createdAt",
  });

  if (loading || data.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
        <Users className="h-3.5 w-3.5" /> Team members ({data.length})
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-ink-500">
        {data.map((m) => (
          <li key={m.id}>
            {m.fullName || m.email}
            {m.fullName && m.email ? ` · ${m.email}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
