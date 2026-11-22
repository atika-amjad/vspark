"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Eye, EyeOff, Loader2, Mail, Phone, ShieldCheck, Upload, User as UserIcon, Zap } from "lucide-react";
import { deleteWhere, insertRow, updateRow } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useCollection } from "@/lib/useCollection";
import { useToast } from "@/lib/toast";
import { authErrorMessage } from "@/lib/authErrors";
import { deleteProof, uploadProof } from "@/lib/proofApi";
import type { Competition, DirectoryUser, Registration, TeamMember } from "@/lib/types";
import { Trash2, Users } from "lucide-react";
import {
  DEPARTMENTS,
  competitionSelectionSchema,
  fieldErrors,
  passwordSchema,
  profileSchema,
  transactionIdSchema,
  validateProofFile,
} from "@/lib/validation";
import UniversityPicker from "./UniversityPicker";
import { Spinner } from "./States";

export type FormMode = "create-account" | "create" | "edit";

interface Props {
  mode: FormMode;
  initial?: Registration;
  defaultCompetitionId?: string;
}

const PAYMENT = {
  title: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_TITLE,
  number: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER,
  bank: process.env.NEXT_PUBLIC_PAYMENT_BANK,
};

export default function RegistrationForm({ mode, initial, defaultCompetitionId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { user, profile, refresh } = useAuth();
  const { data: competitions, loading: compLoading, error: compError } = useCollection<Competition>("competitions");

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [university, setUniversity] = useState(initial?.university ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [regNo, setRegNo] = useState(initial?.regNo ?? "");
  const [transactionId, setTransactionId] = useState(initial?.transactionId ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [selected, setSelected] = useState<string[]>(initial?.competitionIds ?? (defaultCompetitionId ? [defaultCompetitionId] : []));
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Array<{ userId: string; fullName: string; email: string }>>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState("");

  // Prefill name/email for signed-in users adding another registration.
  useEffect(() => {
    if (mode === "create") {
      setFullName((v) => v || profile?.fullName || "");
      setEmail((v) => v || user?.email || "");
    }
  }, [mode, profile, user]);

  const chosen = useMemo(() => competitions.filter((c) => selected.includes(c.id)), [competitions, selected]);
  const total = chosen.reduce((sum, c) => sum + (Number(c.fee) || 0), 0);
  const needsPayment = total > 0;

  // Limit comes from the admin, set per competition.
  const maxTeam = chosen.reduce((max, c) => Math.max(max, Number(c.maxTeamSize) || 1), 1);
  const slotsLeft = Math.max(0, maxTeam - 1 - members.length);

  // Existing teammates (edit mode only).
  const { data: existingMembers } = useCollection<TeamMember>("team_members", {
    eq: [["registrationId", initial?.id ?? "00000000-0000-0000-0000-000000000000"]],
  });
  // Registered users the participant can add.
  const { data: directory, loading: directoryLoading } = useCollection<DirectoryUser>("member_directory");

  useEffect(() => {
    if (mode !== "edit" || membersLoaded) return;
    if (existingMembers.length === 0) return;
    setMembers(existingMembers.map((m) => ({ userId: m.userId, fullName: m.fullName, email: m.email })));
    setMembersLoaded(true);
  }, [mode, existingMembers, membersLoaded]);

  // Drop extra members if the user switches to a competition with a smaller team.
  useEffect(() => {
    const limit = Math.max(0, maxTeam - 1);
    setMembers((prev) => (prev.length > limit ? prev.slice(0, limit) : prev));
  }, [maxTeam]);

  function addMember() {
    const found = directory.find((d) => d.id === memberToAdd);
    setMemberToAdd("");
    if (!found) return;
    setMembers((prev) => {
      if (prev.length >= maxTeam - 1) return prev;
      if (prev.some((m) => m.userId === found.id)) return prev;
      return [...prev, { userId: found.id, fullName: found.fullName, email: found.email }];
    });
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  /** Replaces the teammate rows of a registration. */
  async function saveMembers(registrationId: string, createdAt: string) {
    await deleteWhere("team_members", "registrationId", registrationId);
    const rows = members.map((m) => ({
      registrationId,
      userId: m.userId,
      fullName: m.fullName,
      email: m.email,
      createdAt,
    }));
    if (rows.length) {
      const { error } = await getSupabase().from("team_members").insert(rows);
      if (error) throw new Error(error.message);
    }
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function validate(): Record<string, string> | null {
    const errs: Record<string, string> = {};
    const p = profileSchema.safeParse({ fullName, phone, email, university, department, regNo });
    if (!p.success) Object.assign(errs, fieldErrors(p.error));
    const c = competitionSelectionSchema.safeParse({ competitionIds: selected });
    if (!c.success) Object.assign(errs, fieldErrors(c.error));
    if (mode === "create-account") {
      const pw = passwordSchema.safeParse({ password, confirmPassword });
      if (!pw.success) Object.assign(errs, fieldErrors(pw.error));
    }
    if (needsPayment) {
      const t = transactionIdSchema.safeParse(transactionId);
      if (!t.success) errs.transactionId = t.error.issues[0]?.message ?? "Invalid transaction ID";
      if (!file && !(mode === "edit" && initial?.proofPath)) errs.proof = "Upload a screenshot or PDF of your payment.";
    }
    if (file) {
      const msg = validateProofFile(file);
      if (msg) errs.proof = msg;
    }
    if (members.length > Math.max(0, maxTeam - 1)) {
      errs.team = `This competition allows at most ${maxTeam} people including you.`;
    }
    return Object.keys(errs).length ? errs : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const errs = validate();
    setErrors(errs ?? {});
    if (errs) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();
    const base = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      university: university.trim(),
      department: department.trim(),
      regNo: regNo.trim(),
      competitionIds: chosen.map((c) => c.id),
      competitionTitles: chosen.map((c) => c.title),
      totalAmount: total,
      transactionId: needsPayment ? transactionId.trim() : "",
    };
    let uploaded: { path: string; name: string } | null = null;
    const supabase = getSupabase();

    try {
      if (mode === "create-account") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) throw new Error(signUpError.message);
        const uid = signUpData.user?.id;
        if (!uid) throw new Error("The account could not be created. Please try again.");
        if (!signUpData.session) {
          throw new Error(
            "Email confirmation is enabled on this project. Turn it off in Supabase -> Authentication -> Providers -> Email, then try again.",
          );
        }

        try {
          if (file) uploaded = await uploadProof(file);
          // Registration first: the insert policy allows it while no profile row exists yet.
          const regId = await insertRow("registrations", {
            ...base,
            userId: uid,
            email: email.trim().toLowerCase(),
            proofPath: uploaded?.path ?? "",
            proofName: uploaded?.name ?? "",
            status: "pending",
            adminNote: "",
            createdAt: now,
            updatedAt: now,
          });
          await insertRow("profiles", {
            id: uid,
            email: email.trim().toLowerCase(),
            fullName: base.fullName,
            role: "participant",
            approved: false,
            createdAt: now,
          });
          await saveMembers(regId, now);
        } catch (inner) {
          // Roll back the upload; the account itself can only be removed server-side.
          if (uploaded) await deleteProof(uploaded.path);
          await supabase.auth.signOut().catch(() => undefined);
          throw inner;
        }
        await supabase.auth.signOut();
        toast.success("Registration submitted! An admin will review your payment.");
        router.push("/login?registered=1");
      } else if (mode === "create") {
        if (!user) throw new Error("You must be signed in.");
        if (file) uploaded = await uploadProof(file);
        try {
          const regId = await insertRow("registrations", {
            ...base,
            userId: user.uid,
            email: user.email ?? email.trim().toLowerCase(),
            proofPath: uploaded?.path ?? "",
            proofName: uploaded?.name ?? "",
            status: "pending",
            adminNote: "",
            createdAt: now,
            updatedAt: now,
          });
          await saveMembers(regId, now);
        } catch (inner) {
          if (uploaded) await deleteProof(uploaded.path);
          throw inner;
        }
        toast.success("Registration submitted for review.");
        router.push("/dashboard");
      } else {
        if (!initial) throw new Error("Missing registration.");
        if (file) uploaded = await uploadProof(file);
        try {
          await updateRow("registrations", initial.id, {
            ...base,
            proofPath: uploaded?.path ?? initial.proofPath,
            proofName: uploaded?.name ?? initial.proofName,
            updatedAt: now,
          });
          await saveMembers(initial.id, now);
        } catch (inner) {
          if (uploaded) await deleteProof(uploaded.path);
          throw inner;
        }
        if (uploaded && initial.proofPath) await deleteProof(initial.proofPath);
        await refresh();
        toast.success("Registration updated.");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: string) => errors[k];
  const cls = (k: string) => `input ${err(k) ? "input-error" : ""}`;
  const submitLabel = mode === "edit" ? "Save Changes" : "Complete Registration";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="space-y-6">
        <section className="card p-6 sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><UserIcon className="h-4 w-4" /></span>
            Profile Details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="label">Full name *</label>
              <input id="fullName" className={cls("fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ali Khan" autoComplete="name" maxLength={100} />
              {err("fullName") && <p className="field-error">{err("fullName")}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="label">WhatsApp / Phone *</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input id="phone" className={`${cls("phone")} pl-9`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XXXXXXXXX" inputMode="tel" autoComplete="tel" />
              </div>
              {err("phone") && <p className="field-error">{err("phone")}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email address *</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className={`${cls("email")} pl-9`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali@gmail.com"
                  autoComplete="email"
                  readOnly={mode !== "create-account"}
                />
              </div>
              {err("email") && <p className="field-error">{err("email")}</p>}
            </div>

            {mode === "create-account" && (
              <>
                <div>
                  <label htmlFor="password" className="label">Password *</label>
                  <div className="relative">
                    <input id="password" type={showPw ? "text" : "password"} className={`${cls("password")} pr-10`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-2.5 text-slate-400" aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {err("password") && <p className="field-error">{err("password")}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm password *</label>
                  <input id="confirmPassword" type={showPw ? "text" : "password"} className={cls("confirmPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
                  {err("confirmPassword") && <p className="field-error">{err("confirmPassword")}</p>}
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="university" className="label">University / Institute *</label>
              <UniversityPicker value={university} onChange={setUniversity} error={err("university")} />
            </div>
            <div>
              <label htmlFor="department" className="label">Department *</label>
              <select id="department" className={cls("department")} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="" disabled>Select Dept</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {err("department") && <p className="field-error">{err("department")}</p>}
            </div>
            <div>
              <label htmlFor="regNo" className="label">Registration no. *</label>
              <input id="regNo" className={cls("regNo")} value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="FA23-BSE-001" maxLength={30} />
              {err("regNo") && <p className="field-error">{err("regNo")}</p>}
            </div>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><Zap className="h-4 w-4" /></span>
            Select Competitions
          </h2>
          <p className="mb-5 mt-1 pl-9 text-[11px] font-bold uppercase tracking-wider text-slate-400">Multiple selection allowed</p>
          {compLoading ? (
            <Spinner label="Loading competitions…" />
          ) : compError ? (
            <p className="text-sm text-red-600" role="alert">{compError}</p>
          ) : competitions.length === 0 ? (
            <p className="text-sm text-ink-500">No competitions are open yet. Please check back soon.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {competitions.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <li key={c.id}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${on ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-600" checked={on} onChange={() => toggle(c.id)} />
                      <span>
                        <span className="block font-semibold">{c.title}</span>
                        <span className="text-xs text-ink-500">{c.fee > 0 ? `PKR ${c.fee}` : "Free"} · {c.teamSize}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {err("competitionIds") && <p className="field-error">{err("competitionIds")}</p>}
        </section>

        {maxTeam > 1 && (
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><Users className="h-4 w-4" /></span>
              Team members
            </h2>
            <p className="mb-5 mt-1 pl-9 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin allowed up to {maxTeam} people (including you)
            </p>

            {members.length > 0 && (
              <ul className="mb-4 space-y-2">
                {members.map((m, i) => (
                  <li key={m.userId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-semibold">{m.fullName}</span>
                      <span className="text-ink-500"> · {m.email}</span>
                    </span>
                    <button type="button" className="shrink-0 text-red-600" onClick={() => removeMember(i)} aria-label={`Remove ${m.fullName}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {slotsLeft > 0 ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1">
                  <label htmlFor="memberPick" className="label">Add a registered user</label>
                  <select id="memberPick" className="input" value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} disabled={directoryLoading}>
                    <option value="">{directoryLoading ? "Loading users…" : "Select a user"}</option>
                    {directory
                      .filter((d) => d.id !== user?.uid && !members.some((m) => m.userId === d.id))
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.fullName || d.email} — {d.email}</option>
                      ))}
                  </select>
                </div>
                <button type="button" className="btn-outline" onClick={addMember} disabled={!memberToAdd}>Add member</button>
              </div>
            ) : (
              <p className="text-sm text-ink-500">Team is full — {maxTeam} of {maxTeam} slots used.</p>
            )}
            {err("team") && <p className="field-error">{err("team")}</p>}
          </section>
        )}
      </div>

      <aside className="card h-fit space-y-5 p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 text-white">
          <CreditCard className="absolute right-4 top-4 h-12 w-12 text-white/10" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Account title</p>
          <p className="mb-3 text-sm font-semibold">{PAYMENT.title || "Shared by the organisers"}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Account number</p>
          <p className="mb-3 break-all font-mono text-xl font-bold tracking-wider">{PAYMENT.number || "Not published yet"}</p>
          {PAYMENT.bank && <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold">{PAYMENT.bank}</span>}
        </div>

        <div>
          <label htmlFor="transactionId" className="label">Transaction ID {needsPayment && "*"}</label>
          <input id="transactionId" className={cls("transactionId")} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN-XXXXXXX" disabled={!needsPayment} maxLength={40} />
          <p className="mt-1 text-[11px] text-ink-500">{needsPayment ? "Transfer the total amount below, then enter the ID." : "No payment is needed for the selected competitions."}</p>
          {err("transactionId") && <p className="field-error">{err("transactionId")}</p>}
        </div>

        <div>
          <label htmlFor="proof" className="label">Proof of payment {needsPayment && "*"}</label>
          <label htmlFor="proof" className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 text-sm ${err("proof") ? "border-red-400" : "border-slate-300 hover:border-brand-500"}`}>
            <Upload className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="truncate text-ink-500">{file ? file.name : initial?.proofName ? `Current: ${initial.proofName} (choose to replace)` : "Choose JPG, PNG, WebP or PDF (max 5 MB)"}</span>
          </label>
          <input id="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500"><ShieldCheck className="h-3 w-3" /> Stored privately; only you and the organisers can view it.</p>
          {err("proof") && <p className="field-error">{err("proof")}</p>}
        </div>

        <div className="flex items-end justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold text-ink-500">Total Payable</span>
          <span className="text-2xl font-extrabold text-brand-600">PKR {total}</span>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting || compLoading}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>{submitLabel} <ArrowRight className="h-4 w-4" /></>}
        </button>
        {mode === "create-account" && (
          <p className="text-center text-xs text-ink-500">Already registered? <Link href="/login" className="font-semibold text-brand-600">Log in</Link></p>
        )}
      </aside>
    </form>
  );
}
