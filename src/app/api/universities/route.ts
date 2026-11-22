import { NextResponse } from "next/server";
import type { University } from "@/lib/types";

export const runtime = "nodejs";

// The Hipo Labs API is served over plain HTTP, so browsers on an HTTPS site cannot call it directly
// (mixed content). This route calls it server-side and returns normalised JSON.
const UPSTREAM = "http://universities.hipolabs.com/search";
const SAFE_QUERY = /^[\p{L}\p{N} .,'()&-]{0,80}$/u;

// Small in-memory cache instead of Next's fetch cache: a timed-out upstream
// request used to log "Failed to set fetch cache" because Next tried to store it.
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 50;
const cache = new Map<string, { at: number; data: University[] }>();

interface HipoRecord {
  name?: string;
  country?: string;
  alpha_two_code?: string;
  "state-province"?: string | null;
  web_pages?: string[];
  domains?: string[];
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = (params.get("country") ?? "").trim();
  const name = (params.get("name") ?? "").trim();

  if (!country && !name) {
    return NextResponse.json({ error: "Provide a country or a university name." }, { status: 400 });
  }
  if (!SAFE_QUERY.test(country) || !SAFE_QUERY.test(name)) {
    return NextResponse.json({ error: "Search contains unsupported characters." }, { status: 400 });
  }

  const url = new URL(UPSTREAM);
  if (country) url.searchParams.set("country", country);
  if (name) url.searchParams.set("name", name);

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ universities: cached.data, source: "universities.hipolabs.com", cached: true });
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `The universities service responded with status ${res.status}.` }, { status: 502 });
    }
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "The universities service returned an unexpected response." }, { status: 502 });
    }
    const universities: University[] = (raw as HipoRecord[])
      .filter((r) => typeof r.name === "string" && r.name.length > 0)
      .map((r) => ({
        name: r.name as string,
        country: r.country ?? "",
        alphaTwoCode: r.alpha_two_code ?? "",
        stateProvince: r["state-province"] ?? null,
        webPages: Array.isArray(r.web_pages) ? r.web_pages.filter((w) => typeof w === "string" && /^https?:\/\//i.test(w)) : [],
        domains: Array.isArray(r.domains) ? r.domains : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 300);

    cache.set(cacheKey, { at: Date.now(), data: universities });
    if (cache.size > CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return NextResponse.json({ universities, source: "universities.hipolabs.com" });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return NextResponse.json(
      { error: timedOut ? "The universities service timed out." : "The universities service is unreachable." },
      { status: 502 },
    );
  }
}
