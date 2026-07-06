"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "../_lib/provider";

type NoteType = "soap" | "progress" | "consult" | "procedure" | "discharge" | "nursing" | "addendum" | "operative" | "transfer" | "referral";
type NoteStatus = "draft" | "in_review" | "signed" | "amended" | "cancelled";

interface ClinicalNote {
  id: string; patient_id: string; author_name: string; note_type: NoteType;
  note_title: string; note_body: string; status: NoteStatus; created_at: string; signed_at: string | null;
}
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }
interface ICD11Result { code: string; display: string; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<NoteStatus, string> = { draft: "#94a3b8", in_review: "#f59e0b", signed: "#22c55e", amended: "#a78bfa", cancelled: "#ef4444" };

export default function ClinicalNotesPage() {
  const { session, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<ClinicalNote[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", noteType: "soap" as NoteType, title: "", subjective: "", objective: "", assessment: "", plan: "" });
  const [icdQuery, setIcdQuery] = useState("");
  const [icdResults, setIcdResults] = useState<ICD11Result[] | null>(null);
  const [icdSearching, setIcdSearching] = useState(false);
  const [assessedCode, setAssessedCode] = useState<ICD11Result | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [resolvedProvider, noteData, patientData] = await Promise.all([
        resolveCurrentProvider(session.userId, opts),
        apiFetch<Paginated<ClinicalNote> | ClinicalNote[]>("/api/v1/provider-portal/documentation/notes/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setProvider(resolvedProvider);
      setNotes(unwrap(noteData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load clinical notes."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function searchICD11() {
    if (!session || !icdQuery.trim()) return;
    setIcdSearching(true);
    try {
      const res = await apiFetch<{ results?: ICD11Result[] } | ICD11Result[]>("/api/v1/terminology/search/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ provider: "icd11", query: icdQuery, tenant_id: session.tenantId, limit: 8 }),
      });
      setIcdResults(Array.isArray(res) ? res : res.results ?? []);
    } catch {
      setIcdResults([]);
    } finally {
      setIcdSearching(false);
    }
  }

  async function saveNote(status: "draft" | "signed") {
    if (!session || !provider || !form.patientId || !form.subjective) return;
    setBusy(true);
    const body = [
      `S: ${form.subjective}`,
      form.objective && `O: ${form.objective}`,
      form.assessment && `A: ${form.assessment}${assessedCode ? ` [ICD-11 ${assessedCode.code} — ${assessedCode.display}]` : ""}`,
      form.plan && `P: ${form.plan}`,
    ].filter(Boolean).join("\n\n");
    try {
      await apiFetch("/api/v1/provider-portal/documentation/notes/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          patient_id: form.patientId,
          author_provider_id: provider.id,
          author_name: provider.name,
          author_type: provider.providerType,
          note_type: form.noteType,
          note_title: form.title || "SOAP Note",
          note_body: body,
          status,
          ...(status === "signed" ? { signed_at: new Date().toISOString(), signed_by: provider.id } : {}),
        }),
      });
      setForm({ patientId: "", noteType: "soap", title: "", subjective: "", objective: "", assessment: "", plan: "" });
      setIcdQuery(""); setIcdResults(null); setAssessedCode(null);
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to save note."));
    } finally {
      setBusy(false);
    }
  }

  async function signNote(note: ClinicalNote) {
    if (!session || !provider) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/provider-portal/documentation/notes/${note.id}/`, {
        method: "PATCH", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ status: "signed", signed_at: new Date().toISOString(), signed_by: provider.id }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to sign note."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sorted = (notes || []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/provider-portal" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← Provider Portal</a>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><FileText size={22} /> Clinical Notes</h1>
          <p className="mt-1 text-sm text-ink/50">SOAP notes with ICD-11 diagnosis coding</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Note</button>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}
      {provider === null && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record — you can view notes but can&apos;t author or sign them.
        </div>
      )}

      {showForm && (
        <div className="cy-card mb-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Patient</label>
              <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                <option value="">Select patient…</option>
                {Object.values(patients).map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Note type</label>
              <select value={form.noteType} onChange={e => setForm(f => ({ ...f, noteType: e.target.value as NoteType }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                {(["soap", "progress", "consult", "procedure", "discharge", "addendum"] as NoteType[]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Follow-up visit" className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Subjective</label>
              <textarea value={form.subjective} onChange={e => setForm(f => ({ ...f, subjective: e.target.value }))} rows={2} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Objective</label>
              <textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Assessment</label>
              <textarea value={form.assessment} onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))} rows={2} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              <div className="mt-2 flex gap-2">
                <input
                  value={icdQuery}
                  onChange={e => setIcdQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchICD11()}
                  placeholder="Search ICD-11 diagnosis to attach…"
                  className="w-full max-w-sm rounded-lg border border-ink/10 bg-surface px-3 py-1.5 text-xs"
                />
                <button onClick={searchICD11} disabled={icdSearching || !icdQuery.trim()} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs disabled:opacity-50">
                  <Search size={12} /> {icdSearching ? "…" : "Search"}
                </button>
              </div>
              {assessedCode && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
                  ICD-11 {assessedCode.code} — {assessedCode.display}
                  <button onClick={() => setAssessedCode(null)} className="text-ink/40 hover:text-ink">×</button>
                </div>
              )}
              {icdResults && !assessedCode && (
                <div className="mt-2 grid max-w-sm gap-1">
                  {icdResults.length === 0 && <p className="text-xs text-ink/40">No ICD-11 concepts matched.</p>}
                  {icdResults.map(r => (
                    <button key={r.code} onClick={() => { setAssessedCode(r); setIcdResults(null); }} className="flex items-center justify-between rounded-md border border-ink/10 bg-surface px-2 py-1.5 text-left text-xs hover:border-brand-400/40">
                      <span>{r.display}</span><span className="font-mono text-ink/40">{r.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Plan</label>
              <textarea value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} rows={2} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => saveNote("draft")} disabled={busy || !provider || !form.patientId || !form.subjective} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Save Draft</button>
            <button onClick={() => saveNote("signed")} disabled={busy || !provider || !form.patientId || !form.subjective} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Sign & Save</button>
            <button onClick={() => setShowForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {notes === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading notes…</div>}
        {notes !== null && sorted.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No clinical notes for this tenant yet.</div>}
        {sorted.map(note => {
          const p = patients[note.patient_id];
          return (
            <div key={note.id} className="cy-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{note.note_title || note.note_type.toUpperCase()}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[note.status]}22`, color: STATUS_COLOR[note.status] }}>{note.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink/50">
                    {p ? `${p.first_name} ${p.last_name} (${p.mrn})` : `Patient ${note.patient_id.slice(0, 8)}`} · {note.author_name} · {new Date(note.created_at).toLocaleString()}
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-ink/70">{note.note_body}</pre>
                </div>
                {note.status === "draft" && (
                  <button disabled={busy || !provider} onClick={() => signNote(note)} className="shrink-0 rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Sign</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
