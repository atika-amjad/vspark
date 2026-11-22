"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/States";

/**
 * The admin area now lives inside the unified /dashboard, which adapts to the
 * signed-in role. This route stays only so old links keep working.
 */
export default function AdminRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return <Spinner label="Taking you to your dashboard…" />;
}
