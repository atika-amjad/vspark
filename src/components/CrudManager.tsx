"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteRow, insertRow, updateRow } from "@/lib/db";
import { useCollection } from "@/lib/useCollection";
import { useToast } from "@/lib/toast";
import { EmptyState, ErrorState, Spinner } from "./States";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  max?: number;
}

type Row = { id: string } & Record<string, string | number>;

interface Props {
  collectionName: string;
  singular: string;
  fields: FieldDef[];
  summary: (row: Row) => { title: string; subtitle: string };
  sortBy?: string;
}

/** Generic admin CRUD over a Firestore collection (create, list, update, delete). */
export default function CrudManager({ collectionName, singular, fields, summary, sortBy }: Props) {
  const toast = useToast();
  const { data, loading, error, reload } = useCollection<Row>(collectionName);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const rows = sortBy ? [...data].sort((a, b) => String(b[sortBy] ?? "").localeCompare(String(a[sortBy] ?? ""))) : data;

  function open(row: Row | "new") {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.name] = row === "new" ? (f.options?.[0] ?? "") : String(row[f.name] ?? "");
    setValues(init);
    setErrors({});
    setEditing(row);
  }

  function validate() {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required !== false && !v) errs[f.name] = `${f.label} is required`;
      else if (f.type === "number" && (v === "" || Number.isNaN(Number(v)) || Number(v) < 0)) errs[f.name] = `${f.label} must be a number 0 or greater`;
      else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errs[f.name] = `${f.label} must be a valid date`;
      else if (f.max && v.length > f.max) errs[f.name] = `${f.label} must be at most ${f.max} characters`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || busy) return;
    const payload: Record<string, string | number> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      payload[f.name] = f.type === "number" ? Number(v) : v;
    }
    setBusy(true);
    try {
      if (editing === "new") await insertRow(collectionName, payload, `c-${crypto.randomUUID()}`);
      else if (editing) await updateRow(collectionName, editing.id, payload);
      toast.success(`${singular} saved.`);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(`Could not save: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await deleteRow(collectionName, row.id);
      toast.success(`${singular} deleted.`);
      reload();
    } catch (err) {
      toast.error(`Could not delete: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">{loading ? "Loading…" : `${rows.length} ${rows.length === 1 ? singular.toLowerCase() : `${singular.toLowerCase()}s`}`}</p>
        <button className="btn-primary btn-sm" onClick={() => open("new")}><Plus className="h-3.5 w-3.5" /> Add {singular}</button>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
        <EmptyState message={`No ${singular.toLowerCase()}s yet. Add the first one.`} />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {rows.map((r) => {
            const s = summary(r);
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="truncate text-xs text-ink-500">{s.subtitle}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-outline btn-sm" onClick={() => open(r)} aria-label={`Edit ${s.title}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button className="btn-outline btn-sm text-red-600" onClick={() => remove(r)} aria-label={`Delete ${s.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${editing === "new" ? "Add" : "Edit"} ${singular}`}>
          <form onSubmit={save} noValidate className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing === "new" ? "Add" : "Edit"} {singular}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            {fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={`f-${f.name}`} className="label">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea id={`f-${f.name}`} rows={5} className={`input ${errors[f.name] ? "input-error" : ""}`} value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} />
                ) : f.type === "select" ? (
                  <select id={`f-${f.name}`} className="input" value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input id={`f-${f.name}`} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} min={f.type === "number" ? 0 : undefined} className={`input ${errors[f.name] ? "input-error" : ""}`} value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} />
                )}
                {errors[f.name] && <p className="field-error">{errors[f.name]}</p>}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
