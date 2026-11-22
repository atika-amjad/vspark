import type { RegistrationStatus } from "@/lib/types";

const STYLES: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

export default function StatusBadge({ status }: { status: RegistrationStatus }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STYLES[status]}`}>{status}</span>;
}
