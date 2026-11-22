"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ErrorState, Spinner } from "./States";

/** Client-side route protection. Data access is still enforced by Firestore rules and API token checks. */
export default function AuthGuard({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, isAdmin, loading, configError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !configError && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, configError, user, router, pathname]);

  if (configError) return <div className="container-page py-16"><ErrorState message={configError} /></div>;
  if (loading || !user) return <Spinner label="Checking your session…" />;
  if (requireAdmin && !isAdmin) {
    return (
      <div className="container-page py-16">
        <ErrorState message="You do not have permission to view this page. Admin access is required." />
      </div>
    );
  }
  return <>{children}</>;
}
