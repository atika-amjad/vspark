import { NextResponse } from "next/server";
import { HttpError, PROOF_BUCKET, supabaseAdmin, verifyCaller } from "@/lib/supabaseServer";
import { ALLOWED_PROOF_TYPES, MAX_PROOF_BYTES } from "@/lib/validation";

export const runtime = "nodejs";

function detectType(bytes: Uint8Array): string | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(request: Request) {
  try {
    const { uid } = await verifyCaller(request);

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file was uploaded.");
    if (file.size === 0) throw new HttpError(400, "The uploaded file is empty.");
    if (file.size > MAX_PROOF_BYTES) throw new HttpError(413, "File is larger than 5 MB.");
    if (!(ALLOWED_PROOF_TYPES as readonly string[]).includes(file.type)) {
      throw new HttpError(415, "Only JPG, PNG, WebP or PDF files are allowed.");
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const realType = detectType(buffer);
    if (!realType || realType !== file.type) {
      throw new HttpError(415, "The file content does not match its declared type.");
    }

    // The stored name is generated server-side; the user-supplied name is never used as a path.
    const path = `${uid}/${Date.now()}-${crypto.randomUUID()}.${EXT[realType]}`;
    const { error } = await supabaseAdmin().storage.from(PROOF_BUCKET).upload(path, buffer, {
      contentType: realType,
      upsert: false,
    });
    if (error) throw new HttpError(502, "Storage upload failed. Please try again.");

    return NextResponse.json({ path, name: file.name.slice(0, 120) });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[api/upload]", err instanceof Error ? err.message : err);
  return NextResponse.json({ error: "Server error while handling the upload." }, { status: 500 });
}
