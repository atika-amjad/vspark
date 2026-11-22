"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, LayoutDashboard, Pencil, Plus, Settings, ShieldCheck, Trash2 } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";
import AuthGuard from "@/components/AuthGuard";
import MyResults from "@/components/MyResults";
import MemberList from "@/components/MemberList";
import PageHeader from "@/components/PageHeader";
import ProofButton from "@/components/ProofButton";
import StatusBadge from "@/components/StatusBadge";
import UpcomingEvents from "@/components/UpcomingEvents";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import { useAuth } from "@/lib/auth-context";
import { deleteRow } from "@/lib/db";
import { deleteProof } from "@/lib/proofApi";
import { useCollection } from "@/lib/useCollection";
import { useToast } from "@/lib/toast";
import type { Registration } from "@/lib/types";

/** Participant area: the signed-in user's own registrations. */
function MyRegistrations() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useCollection<Registration>("registrations", { eq: [["userId", user!.uid]] });
  const [busyId, setBusyId] = useState<string | null>(null);
  const approved = Boolean(profile?.approved);
  const rows = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function cancel(r: Registration) {
    if (!window.confirm("Cancel and delete this registration? This cannot be undone.")) return;
    setBusyId(r.id);
    try {
      await deleteRow("registrations", r.id);
      await deleteProof(r.proofPath);
      toast.success("Registration cancelled.");
      reload();
    } catch (e) {
      toast.error(`Could not cancel: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container-page max-w-4xl">
      {approved ? (
        <div role="status" className="mb-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> <p>Your account is <strong>approved</strong>. You can register for more competitions.</p>
        </div>
      ) : (
        <div role="status" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" /> <p>Your account is <strong>pending admin approval</strong>. You can edit or cancel your pending registration until it is reviewed.</p>
        </div>
      )}

      <UpcomingEvents />
      <MyResults />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">My registrations</h2>
        {approved ? (
          <Link href="/dashboard/new" className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New registration</Link>
        ) : (
          <span className="text-xs text-ink-500">New registrations unlock after approval</span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
        <EmptyState message="You have no registrations yet." />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{r.competitionTitles.join(", ")}</p>
                  <p className="text-xs text-ink-500">{r.university} · {r.department} · {r.regNo}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-3 text-sm text-ink-700">Total: <strong>PKR {r.totalAmount}</strong>{r.transactionId && <> · TXN: {r.transactionId}</>}</p>
              {r.adminNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-700">Organiser note: {r.adminNote}</p>}
              <MemberList registrationId={r.id} />
              <div className="mt-4 flex flex-wrap gap-2">
                <ProofButton path={r.proofPath} name={r.proofName} />
                {r.status === "pending" && (
                  <Link href={`/dashboard/registrations/${r.id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                )}
                {r.status !== "approved" && (
                  <button className="btn-outline btn-sm text-red-600" disabled={busyId === r.id} onClick={() => cancel(r)}><Trash2 className="h-3.5 w-3.5" /> Cancel</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type View = "admin" | "mine";

/** One dashboard for everyone; the role decides what is shown. */
function DashboardContent() {
  const { isAdmin, profile, user } = useAuth();
  const [view, setView] = useState<View>("admin");

  const name = profile?.fullName || user?.email || "your account";

  return (
    <>
      {isAdmin ? (
        <div className="container-page max-w-4xl">
          <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <p>Signed in as <strong>administrator</strong> ({name}). You can review registrations and manage all content.</p>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setView("admin")}
                className={`btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "admin" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-700"}`}
              >
                <Settings className="mr-1 inline h-3.5 w-3.5" /> Admin tools
              </button>
              <button
                onClick={() => setView("mine")}
                className={`btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "mine" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-700"}`}
              >
                <LayoutDashboard className="mr-1 inline h-3.5 w-3.5" /> My registrations
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdmin && view === "admin" ? <AdminPanel /> : <MyRegistrations />}
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader badge="Your portal" title="My" accent="Dashboard" subtitle="Manage your registrations — or review everything if you are an admin." />
      <AuthGuard><DashboardContent /></AuthGuard>
    </>
  );
}
