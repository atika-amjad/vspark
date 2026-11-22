"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RegistrationForm from "@/components/RegistrationForm";
import { useAuth } from "@/lib/auth-context";
import { ErrorState, Spinner } from "@/components/States";

function RegisterContent() {
  const params = useSearchParams();
  const { user, loading, configError } = useAuth();
  if (configError) return <ErrorState message={configError} />;
  if (loading) return <Spinner />;
  if (user) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">You already have an account.</p>
        <p className="mt-1 text-sm text-ink-500">Use your dashboard to register for more competitions.</p>
        <Link href="/dashboard" className="btn-primary mt-5">Go to dashboard</Link>
      </div>
    );
  }
  return <RegistrationForm mode="create-account" defaultCompetitionId={params.get("competition") ?? undefined} />;
}

export default function RegisterPage() {
  return (
    <>
      <PageHeader badge="National innovation event" title="Register for" accent="VSpark" subtitle="Join 500+ participants from across the country. Select your university and competitions to get started." />
      <div className="container-page max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <RegisterContent />
        </Suspense>
      </div>
    </>
  );
}
