"use client";

import { useState, useEffect, useCallback } from "react";
import { Banknote } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type RunStatus = "draft" | "approved" | "paid";

interface PayrollRun {
  id: string; run_date: string; status: RunStatus;
  total_gross: string; total_deductions: string; total_net: string;
}
interface Payslip {
  id: string; payroll_run: string; employee_id: string;
  basic_salary: string; allowances: string; deductions: string; net_salary: string;
}
interface Employee { id: string; first_name: string; last_name: string; job_title: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<RunStatus, string> = { draft: "#94a3b8", approved: "#3b82f6", paid: "#22c55e" };

export default function PayrollPage() {
  const { session, isAuthenticated } = useAuth();
  const [runs, setRuns] = useState<PayrollRun[] | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNewRun, setShowNewRun] = useState(false);
  const [runDate, setRunDate] = useState("");

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [runData, payslipData, employeeData] = await Promise.all([
        apiFetch<Paginated<PayrollRun> | PayrollRun[]>("/api/v1/erp/payroll/runs/", opts),
        apiFetch<Paginated<Payslip> | Payslip[]>("/api/v1/erp/payroll/payslips/", opts),
        apiFetch<Paginated<Employee> | Employee[]>("/api/v1/erp/hr/employees/", opts),
      ]);
      setRuns(unwrap(runData));
      setPayslips(unwrap(payslipData));
      const eMap: Record<string, Employee> = {};
      for (const e of unwrap(employeeData)) eMap[e.id] = e;
      setEmployees(eMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load payroll data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createRun() {
    if (!session || !runDate) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/erp/payroll/runs/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ run_date: runDate, status: "draft" }),
      });
      setRunDate(""); setShowNewRun(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to create payroll run."));
    } finally {
      setBusy(false);
    }
  }

  async function advanceRun(run: PayrollRun) {
    if (!session) return;
    const next: RunStatus = run.status === "draft" ? "approved" : "paid";
    setBusy(true);
    try {
      await apiFetch(`/api/v1/erp/payroll/runs/${run.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: next }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to update payroll run."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sortedRuns = (runs || []).slice().sort((a, b) => b.run_date.localeCompare(a.run_date));
  const slipsForRun = (runId: string) => payslips.filter(p => p.payroll_run === runId);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/erp" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← ERP</a>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Banknote size={22} /> Payroll</h1>
          <p className="mt-1 text-sm text-ink/50">Payroll runs and payslips</p>
        </div>
        <button onClick={() => setShowNewRun(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Run</button>
      </header>

      {fetchError && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      {showNewRun && (
        <div className="cy-card mb-6 p-5">
          <label className="mb-1 block text-xs text-ink/50">Run date</label>
          <input type="date" value={runDate} onChange={e => setRunDate(e.target.value)} className="w-full max-w-xs rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <div className="mt-4 flex gap-2">
            <button onClick={createRun} disabled={busy || !runDate} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Create</button>
            <button onClick={() => setShowNewRun(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {runs === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading payroll runs…</div>}
        {runs !== null && sortedRuns.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No payroll runs yet.</div>}
        {sortedRuns.map(run => {
          const slips = slipsForRun(run.id);
          const expanded = selectedRun === run.id;
          return (
            <div key={run.id} className="cy-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{new Date(run.run_date).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</div>
                  <div className="text-xs text-ink/50">Net SAR {Number(run.total_net).toLocaleString()} · {slips.length} payslips</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[run.status]}22`, color: STATUS_COLOR[run.status] }}>{run.status}</span>
                  {run.status !== "paid" && (
                    <button disabled={busy} onClick={() => advanceRun(run)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">
                      {run.status === "draft" ? "Approve" : "Mark Paid"}
                    </button>
                  )}
                  <button onClick={() => setSelectedRun(expanded ? null : run.id)} className="rounded-md border border-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5">
                    {expanded ? "Hide" : "Payslips"}
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  {slips.length === 0 ? (
                    <p className="text-sm text-ink/40">No payslips generated for this run yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-ink/40">
                          <th className="pb-2">Employee</th><th className="pb-2">Basic</th><th className="pb-2">Allowances</th><th className="pb-2">Deductions</th><th className="pb-2">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slips.map(s => {
                          const e = employees[s.employee_id];
                          return (
                            <tr key={s.id} className="border-t border-ink/5">
                              <td className="py-2">{e ? `${e.first_name} ${e.last_name}` : `Employee ${s.employee_id.slice(0, 8)}`}</td>
                              <td className="py-2 tabular-nums">{Number(s.basic_salary).toLocaleString()}</td>
                              <td className="py-2 tabular-nums">{Number(s.allowances).toLocaleString()}</td>
                              <td className="py-2 tabular-nums">{Number(s.deductions).toLocaleString()}</td>
                              <td className="py-2 font-semibold tabular-nums">{Number(s.net_salary).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
