"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PageHeader from "@/components/PageHeader";
import RegistrationForm from "@/components/RegistrationForm";
import { ErrorState, Spinner } from "@/components/States";
import { useAuth } from "@/lib/auth-context";

function Content() {
  const { profile } = useAuth();
  const params = useSearchParams();
  if (!profile?.approved) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message="Your account must be approved by an admin before you can add new registrations." />
        <div className="mt-4 text-center"><Link href="/dashboard" className="btn-outline">Back to dashboard</Link></div>
      </div>
    );
  }
  return <RegistrationForm mode="create" defaultCompetitionId={params.get("competition") ?? undefined} />;
}

export default function NewRegistrationPage() {
  return (
    <>
      <PageHeader badge="Participant area" title="New" accent="Registration" subtitle="Register for additional competitions." />
      <div className="container-page max-w-5xl">
        <AuthGuard>
          <Suspense fallback={<Spinner />}><Content /></Suspense>
        </AuthGuard>
      </div>
    </>
  );
}
