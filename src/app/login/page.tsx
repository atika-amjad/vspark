"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Info, Loader2, LogIn, Lock, Mail } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/authErrors";
import { fieldErrors, loginSchema } from "@/lib/validation";
import { useToast } from "@/lib/toast";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { user, loading, configError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (!loading && user && !submitting) router.replace(next);
  }, [loading, user, submitting, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw new Error(error.message);
      toast.success("Welcome back!");
      // Navigation is handled by the effect above once the session reaches AuthProvider,
      // so the guard does not see a signed-out user and bounce us back here.
      setSubmitting(false);
    } catch (err) {
      setFormError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-4">
      {params.get("registered") === "1" && (
        <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Registration received. Your account is <strong>pending admin approval</strong>. You can log in now to track or edit your registration.</p>
        </div>
      )}
      {configError && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{configError}</p>}

      <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><LogIn className="h-5 w-5" /></span>
          <h2 className="mt-3 text-lg font-bold">Participant Login</h2>
        </div>
        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input id="email" type="email" autoComplete="email" className={`input pl-9 ${errors.email ? "input-error" : ""}`} placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className={`input px-9 ${errors.password ? "input-error" : ""}`} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-2.5 text-slate-400" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
        </button>
        <p className="border-t border-slate-100 pt-4 text-center text-sm text-ink-500">
          Don&apos;t have an account? <Link href="/register" className="font-semibold text-brand-600">Register here →</Link>
        </p>
      </form>

      <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>New registrations stay <strong>pending</strong> until an admin verifies your payment. Questions? Contact the VSpark team.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <PageHeader badge="Participant access" title="Login" subtitle="Sign in to manage your VSpark registrations." />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
