"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Department { id: string; name: string; code: string; }
interface Employee { id: string; first_name: string; last_name: string; department: string | null; job_title: string; hire_date: string; status: string; }
interface LeaveRequest { id: string; employee: string; leave_type: string; start_date: string; end_date: string; status: "pending" | "approved" | "rejected"; reason: string; }
interface Paginated<T> { count: number; results: T[]; }

const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444" };

export default function HRPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [deptPage, empPage, leavePage] = await Promise.all([
        apiFetch<Paginated<Department>>("/api/v1/erp/hr/departments/", opts),
        apiFetch<Paginated<Employee>>("/api/v1/erp/hr/employees/", opts),
        apiFetch<Paginated<LeaveRequest>>("/api/v1/erp/hr/leave-requests/", opts),
      ]);
      setDepartments(deptPage.results);
      setEmployees(empPage.results);
      setLeaves(leavePage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load HR data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleLeave = async (id: string, status: "approved" | "rejected") => {
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
  };

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div role="alert" className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load HR data</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (employees === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading live HR data...</div>;
  }

  const departmentName = (id: string | null) => departments.find(d => d.id === id)?.name || (isAr ? "غير محدد" : "Unassigned");
  const headcountByDept = departments.map(d => ({ dept: d, count: employees.filter(e => e.department === d.id).length }));
  const unassignedCount = employees.filter(e => !e.department).length;
  const recentHires = employees
    .filter(e => (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .sort((a, b) => b.hire_date.localeCompare(a.hire_date));
  const pending = leaves.filter(l => l.status === "pending");
  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between border-b border-brand-400/30 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "الموارد البشرية" : "Human Resources"}</h1>
          <p className="text-sm text-ink/50">{employees.length} {isAr ? "موظف" : "staff"} · {pending.length} {isAr ? "طلب إجازة معلق" : "pending leave requests"}</p>
        </div>
        <div className="flex gap-3">
          <a href="/erp" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-6 grid grid-cols-[1fr_1.5fr] gap-6">
        <div>
          <div className="cy-card p-5">
            <div className="mb-3 text-sm font-bold text-brand-400">{isAr ? "القوى العاملة حسب القسم" : "Headcount by Department"}</div>
            {headcountByDept.length === 0 && unassignedCount === 0 && (
              <p className="text-sm text-ink/50">{isAr ? "لا توجد بيانات" : "No department data yet."}</p>
            )}
            {headcountByDept.map(({ dept, count }) => <div key={dept.id} className="flex justify-between border-b border-ink/10 py-2"><span className="text-sm">{dept.name}</span><span className="font-bold text-brand-400">{count}</span></div>)}
            {unassignedCount > 0 && <div className="flex justify-between border-b border-ink/10 py-2"><span className="text-sm">{isAr ? "غير محدد" : "Unassigned"}</span><span className="font-bold text-brand-400">{unassignedCount}</span></div>}
            <div className="flex justify-between py-2 font-bold"><span>{isAr ? "الإجمالي" : "Total"}</span><span className="text-brand-400">{employees.length}</span></div>
          </div>
          <div className="cy-card mt-4 p-5">
            <div className="mb-3 text-sm font-bold text-brand-400">{isAr ? "التوظيف الجديد (30 يوماً)" : "Recently Hired (last 30 days)"}</div>
            {recentHires.length === 0 && <p className="text-sm text-ink/50">{isAr ? "لا يوجد موظفون جدد" : "No new hires in the last 30 days."}</p>}
            {recentHires.map(e => (
              <div key={e.id} className="flex justify-between border-b border-ink/10 py-1.5">
                <div>
                  <div className="text-sm font-semibold">{e.first_name} {e.last_name}</div>
                  <div className="text-xs text-ink/50">{e.job_title} · {e.hire_date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cy-card overflow-x-auto p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-brand-400">{isAr ? "طلبات الإجازة" : "Leave Requests"}</div>
            <div className="flex gap-1.5">
              {["all", "pending", "approved", "rejected"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}>
                  {f === "all" ? (isAr ? "الكل" : "All") : f}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[isAr ? "الموظف" : "Employee", isAr ? "النوع" : "Type", isAr ? "الفترة" : "Period", isAr ? "الحالة" : "Status", ""].map((h, i) => (
                  <th key={i} className={`border-b border-ink/10 px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="border-b border-ink/10 px-3 py-2.5 text-center text-sm text-ink/40">{isAr ? "لا توجد طلبات إجازة" : "No leave requests."}</td></tr>}
              {filtered.map(l => (
                <tr key={l.id}>
                  <td className="border-b border-ink/10 px-3 py-2.5 text-sm font-semibold">{employees.find(e => e.id === l.employee) ? `${employees.find(e => e.id === l.employee)!.first_name} ${employees.find(e => e.id === l.employee)!.last_name}` : "Unknown"}</td>
                  <td className="border-b border-ink/10 px-3 py-2.5 text-sm">{l.leave_type}</td>
                  <td className="border-b border-ink/10 px-3 py-2.5 text-xs">{l.start_date} → {l.end_date}</td>
                  <td className="border-b border-ink/10 px-3 py-2.5">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[l.status]}22`, color: STATUS_COLOR[l.status], border: `1px solid ${STATUS_COLOR[l.status]}55` }}>{l.status}</span>
                  </td>
                  <td className="border-b border-ink/10 px-3 py-2.5">
                    {l.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleLeave(l.id, "approved")} aria-label="Approve leave request" className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">✓</button>
                        <button onClick={() => handleLeave(l.id, "rejected")} aria-label="Reject leave request" className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">✗</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
