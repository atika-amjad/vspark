"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRow } from "@/lib/db";
import { SUPABASE_NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "@/lib/supabase";
import type { BlogPost } from "@/lib/types";
import { ErrorState, Spinner } from "@/components/States";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isSupabaseConfigured) {
        setMessage(SUPABASE_NOT_CONFIGURED_MESSAGE);
        setState("error");
        return;
      }
      try {
        const data = await getRow<BlogPost>("blogs", id);
        if (cancelled) return;
        if (!data) return setState("missing");
        setPost(data);
        setState("ready");
      } catch (e) {
        if (cancelled) return;
        setMessage(`Could not load this post: ${e instanceof Error ? e.message : "unknown error"}`);
        setState("error");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="container-page max-w-3xl py-12">
      <Link href="/blogs" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><ArrowLeft className="h-4 w-4" /> All posts</Link>
      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState message={message} />}
      {state === "missing" && <ErrorState message="This post does not exist or was removed." />}
      {state === "ready" && post && (
        <article>
          <span className="pill">{post.category}</span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-sm text-ink-500">{post.author} · {post.date}</p>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-700">
            {post.content.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </article>
      )}
    </div>
  );
}
