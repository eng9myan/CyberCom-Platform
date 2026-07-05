"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Check, XIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Department { id: string; name: string; code: string; }
interface Employee { id: string; first_name: string; last_name: string; department: string | null; job_title: string; hire_date: string; status: string; }
interface LeaveRequest { id: string; employee: string; leave_type: string; start_date: string; end_date: string; status: "pending" | "approved" | "rejected"; reason: string; }
interface PayrollRun { id: string; run_date: string; status: string; total_gross: string; total_deductions: string; total_net: string; }
interface Paginated<T> { count: number; results: T[]; }

export default function HRPayroll() {
  const { session, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [deptPage, empPage, leavePage, payrollPage] = await Promise.all([
        apiFetch<Paginated<Department>>("/api/v1/erp/hr/departments/", opts),
        apiFetch<Paginated<Employee>>("/api/v1/erp/hr/employees/", opts),
        apiFetch<Paginated<LeaveRequest>>("/api/v1/erp/hr/leave-requests/", opts),
        apiFetch<Paginated<PayrollRun>>("/api/v1/erp/payroll/runs/", opts),
      ]);
      setDepartments(deptPage.results);
      setEmployees(empPage.results);
      setLeaveRequests(leavePage.results);
      setPayrollRuns(payrollPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load HR data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function decideLeave(id: string, status: "approved" | "rejected") {
    if (!session) return;
    try {
      await apiFetch(`/api/v1/erp/hr/leave-requests/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || "Failed to update leave request.");
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load HR data</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }
  if (employees === null) {
    return <div className="mt-16 text-center text-white/50">Loading live HR data...</div>;
  }

  const departmentName = (id: string | null) => departments.find(d => d.id === id)?.name || "Unassigned";
  const employeeName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "Unknown employee";
  };
  const pendingLeave = leaveRequests.filter(l => l.status === "pending");
  const recentHires = employees
    .filter(e => (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .sort((a, b) => b.hire_date.localeCompare(a.hire_date));
  const latestPayrollRun = payrollRuns.slice().sort((a, b) => b.run_date.localeCompare(a.run_date))[0];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users size={22} /> HR & Payroll</h1>
        <p className="mt-1 text-sm text-white/50">Live workforce data for this tenant</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Employees</p>
          <p className="mt-1 text-xl font-bold text-brand-300">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Departments</p>
          <p className="mt-1 text-xl font-bold text-purple-400">{departments.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Pending Leave</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{pendingLeave.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Latest Payroll Net</p>
          <p className="mt-1 text-xl font-bold text-green-400">
            {latestPayrollRun ? `SAR ${parseFloat(latestPayrollRun.total_net).toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Pending Leave Requests</h2>
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Employee", "Type", "Start", "End", "Reason", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingLeave.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-white/50">No pending leave requests.</td></tr>
              )}
              {pendingLeave.map(l => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{employeeName(l.employee)}</td>
                  <td className="px-4 py-3 capitalize text-white/60">{l.leave_type}</td>
                  <td className="px-4 py-3 text-white/60">{l.start_date}</td>
                  <td className="px-4 py-3 text-white/60">{l.end_date}</td>
                  <td className="px-4 py-3 text-white/60">{l.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => decideLeave(l.id, "approved")} className="rounded-md bg-green-500/15 p-1.5 text-green-400 hover:bg-green-500/25"><Check size={14} /></button>
                      <button onClick={() => decideLeave(l.id, "rejected")} className="rounded-md bg-red-500/15 p-1.5 text-red-400 hover:bg-red-500/25"><XIcon size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Recently Hired (last 30 days)</h2>
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Name", "Department", "Job Title", "Hire Date", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentHires.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/50">No new hires in the last 30 days.</td></tr>
              )}
              {recentHires.map(e => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{e.first_name} {e.last_name}</td>
                  <td className="px-4 py-3 text-white/60">{departmentName(e.department)}</td>
                  <td className="px-4 py-3 text-white/60">{e.job_title}</td>
                  <td className="px-4 py-3 text-white/60">{e.hire_date}</td>
                  <td className="px-4 py-3 capitalize text-white/60">{e.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Payroll Runs</h2>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Run Date", "Status", "Gross", "Deductions", "Net"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrollRuns.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/50">No payroll runs recorded yet.</td></tr>
              )}
              {payrollRuns.map(r => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-white/60">{r.run_date}</td>
                  <td className="px-4 py-3 capitalize text-white/60">{r.status}</td>
                  <td className="px-4 py-3">{parseFloat(r.total_gross).toLocaleString()}</td>
                  <td className="px-4 py-3">{parseFloat(r.total_deductions).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">{parseFloat(r.total_net).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
