import { NextResponse } from "next/server";
import { HttpError, PROOF_BUCKET, supabaseAdmin, verifyCaller, type VerifiedCaller } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// First segment is the owner's uid (a UUID, so hyphens are required); second is the generated filename.
const PATH_RE = /^[A-Za-z0-9-]{1,64}\/[A-Za-z0-9\-_.]{1,120}$/;
const SIGNED_URL_SECONDS = 120;

function assertAccess(path: string | null, caller: VerifiedCaller): string {
  if (!path || !PATH_RE.test(path)) throw new HttpError(400, "Invalid file path.");
  const owner = path.split("/")[0];
  if (owner !== caller.uid && !caller.isAdmin) throw new HttpError(403, "You do not have access to this file.");
  return path;
}

/** GET /api/proof?path=<uid>/<file> -> short-lived signed URL (owner or admin only). */
export async function GET(request: Request) {
  try {
    const caller = await verifyCaller(request);
    const path = assertAccess(new URL(request.url).searchParams.get("path"), caller);
    const { data, error } = await supabaseAdmin().storage.from(PROOF_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error || !data) throw new HttpError(404, "File not found.");
    return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_SECONDS });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/proof  { path } -> removes the file (owner or admin only). */
export async function DELETE(request: Request) {
  try {
    const caller = await verifyCaller(request);
    const body = (await request.json().catch(() => null)) as { path?: string } | null;
    const path = assertAccess(body?.path ?? null, caller);
    const { error } = await supabaseAdmin().storage.from(PROOF_BUCKET).remove([path]);
    if (error) throw new HttpError(502, "Could not delete the file.");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[api/proof]", err instanceof Error ? err.message : err);
  return NextResponse.json({ error: "Server error." }, { status: 500 });
}
