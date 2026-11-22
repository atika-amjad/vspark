"use client";

import { useMemo, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { deleteRow, updateRow, updateWhere } from "@/lib/db";
import { useCollection } from "@/lib/useCollection";
import { useToast } from "@/lib/toast";
import { deleteProof } from "@/lib/proofApi";
import type { Registration, RegistrationStatus } from "@/lib/types";
import { EmptyState, ErrorState, Spinner } from "./States";
import StatusBadge from "./StatusBadge";
import ProofButton from "./ProofButton";
import MemberList from "./MemberList";

const FILTERS: Array<RegistrationStatus | "all"> = ["all", "pending", "approved", "rejected"];

export default function AdminRegistrations() {
  const toast = useToast();
  const { data, loading, error, reload } = useCollection<Registration>("registrations");
  const [filter, setFilter] = useState<RegistrationStatus | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(
    () => [...data].filter((r) => filter === "all" || r.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data, filter],
  );

  /** A participant account is approved when at least one of their registrations is approved. */
  async function syncUserApproval(userId: string, regs: Registration[]) {
    const approved = regs.some((r) => r.userId === userId && r.status === "approved");
    await updateWhere("profiles", ["id", userId], { approved }).catch(() => undefined);
  }

  async function setStatus(reg: Registration, status: RegistrationStatus) {
    let adminNote = reg.adminNote;
    if (status === "rejected") {
      const reason = window.prompt("Reason for rejection (shown to the participant):", reg.adminNote || "");
      if (reason === null) return;
      adminNote = reason.trim().slice(0, 300);
    }
    setBusyId(reg.id);
    try {
      await updateRow("registrations", reg.id, { status, adminNote, updatedAt: new Date().toISOString() });
      const next = data.map((r) => (r.id === reg.id ? { ...r, status } : r));
      await syncUserApproval(reg.userId, next);
      toast.success(`Registration ${status}.`);
      reload();
    } catch (e) {
      toast.error(`Could not update: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(reg: Registration) {
    if (!window.confirm(`Delete the registration of ${reg.fullName}? This also removes the uploaded proof.`)) return;
    setBusyId(reg.id);
    try {
      await deleteRow("registrations", reg.id);
      await deleteProof(reg.proofPath);
      await syncUserApproval(reg.userId, data.filter((r) => r.id !== reg.id));
      toast.success("Registration deleted.");
      reload();
    } catch (e) {
      toast.error(`Could not delete: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize ${filter === f ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-700"}`}
          >
            {f}{f !== "all" ? ` (${data.filter((r) => r.status === f).length})` : ` (${data.length})`}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
        <EmptyState message={`No ${filter === "all" ? "" : filter + " "}registrations.`} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{r.fullName} <span className="ml-2 align-middle"><StatusBadge status={r.status} /></span></p>
                  <p className="text-xs text-ink-500">{r.email} · {r.phone}</p>
                  <p className="text-xs text-ink-500">{r.university} · {r.department} · {r.regNo}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-extrabold text-brand-600">PKR {r.totalAmount}</p>
                  <p className="text-xs text-ink-500">TXN: {r.transactionId || "—"}</p>
                </div>
              </div>
              <p className="mt-3 text-sm"><span className="font-semibold">Competitions:</span> {r.competitionTitles.join(", ")}</p>
              <MemberList registrationId={r.id} />
              {r.adminNote && <p className="mt-1 text-xs text-ink-500">Note: {r.adminNote}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ProofButton path={r.proofPath} name={r.proofName} />
                {r.status !== "approved" && (
                  <button className="btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, "approved")}><Check className="h-3.5 w-3.5" /> Approve</button>
                )}
                {r.status !== "rejected" && (
                  <button className="btn-outline btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, "rejected")}><X className="h-3.5 w-3.5" /> Reject</button>
                )}
                {r.status !== "pending" && (
                  <button className="btn-outline btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, "pending")}>Mark pending</button>
                )}
                <button className="btn-outline btn-sm ml-auto text-red-600" disabled={busyId === r.id} onClick={() => remove(r)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
