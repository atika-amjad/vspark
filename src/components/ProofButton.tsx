"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getProofUrl } from "@/lib/proofApi";
import { useToast } from "@/lib/toast";

/** Fetches a short-lived signed URL from the server (owner/admin only) and opens it. */
export default function ProofButton({ path, name }: { path: string; name?: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (!path) return <span className="text-xs text-ink-500">No proof uploaded</span>;

  async function open() {
    setBusy(true);
    try {
      const url = await getProofUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={open} disabled={busy} className="btn-outline btn-sm" title={name}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} View proof
    </button>
  );
}
