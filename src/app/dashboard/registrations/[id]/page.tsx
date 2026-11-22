"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PageHeader from "@/components/PageHeader";
import RegistrationForm from "@/components/RegistrationForm";
import { ErrorState, Spinner } from "@/components/States";
import { useAuth } from "@/lib/auth-context";
import { getRow } from "@/lib/db";
import type { Registration } from "@/lib/types";

function Content() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [reg, setReg] = useState<Registration | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await getRow<Registration>("registrations", id);
        if (cancelled) return;
        if (!data) throw new Error("This registration does not exist.");
        if (data.userId !== user?.uid) throw new Error("You do not have access to this registration.");
        if (data.status !== "pending") throw new Error("Only pending registrations can be edited.");
        setReg(data);
        setState("ready");
      } catch (e) {
        if (cancelled) return;
        setMessage(e instanceof Error ? e.message : "Could not load the registration.");
        setState("error");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id, user?.uid]);

  if (state === "loading") return <Spinner />;
  if (state === "error" || !reg) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message={message} />
        <div className="mt-4 text-center"><Link href="/dashboard" className="btn-outline">Back to dashboard</Link></div>
      </div>
    );
  }
  return <RegistrationForm mode="edit" initial={reg} />;
}

export default function EditRegistrationPage() {
  return (
    <>
      <PageHeader badge="Participant area" title="Edit" accent="Registration" subtitle="Update your details while the registration is still pending." />
      <div className="container-page max-w-5xl">
        <AuthGuard><Content /></AuthGuard>
      </div>
    </>
  );
}
