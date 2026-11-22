import { requireAccessToken } from "./supabase";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

export async function uploadProof(file: File): Promise<{ path: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${await requireAccessToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { path: string; name: string };
}

export async function getProofUrl(path: string): Promise<string> {
  const res = await fetch(`/api/proof?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${await requireAccessToken()}` },
  });
  if (!res.ok) throw new Error(await readError(res));
  return ((await res.json()) as { url: string }).url;
}

/** Best-effort removal; failures are ignored because the database record is the source of truth. */
export async function deleteProof(path: string): Promise<void> {
  if (!path) return;
  try {
    const token = await requireAccessToken();
    await fetch("/api/proof", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch {
    /* ignore */
  }
}
