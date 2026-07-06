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
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load HR data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (employees === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live HR data...</div>;
  }

  const departmentName = (id: string | null) => departments.find(d => d.id === id)?.name || (isAr ? "غير محدد" : "Unassigned");
  const headcountByDept = departments.map(d => ({ dept: d, count: employees.filter(e => e.department === d.id).length }));
  const unassignedCount = employees.filter(e => !e.department).length;
  const recentHires = employees
    .filter(e => (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .sort((a, b) => b.hire_date.localeCompare(a.hire_date));
  const pending = leaves.filter(l => l.status === "pending");
  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem", marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem" },
    sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.75rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.6rem 0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.82rem" },
    td: { padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "الموارد البشرية" : "Human Resources"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{employees.length} {isAr ? "موظف" : "staff"} · {pending.length} {isAr ? "طلب إجازة معلق" : "pending leave requests"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.twoCol}>
        <div>
          <div style={s.card}>
            <div style={s.sectionTitle}>{isAr ? "القوى العاملة حسب القسم" : "Headcount by Department"}</div>
            {headcountByDept.length === 0 && unassignedCount === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{isAr ? "لا توجد بيانات" : "No department data yet."}</p>
            )}
            {headcountByDept.map(({ dept, count }) => <div key={dept.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}><span style={{ fontSize: "0.875rem" }}>{dept.name}</span><span style={{ fontWeight: 700, color: "#22D3EE" }}>{count}</span></div>)}
            {unassignedCount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}><span style={{ fontSize: "0.875rem" }}>{isAr ? "غير محدد" : "Unassigned"}</span><span style={{ fontWeight: 700, color: "#22D3EE" }}>{unassignedCount}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700 }}><span>{isAr ? "الإجمالي" : "Total"}</span><span style={{ color: "#22D3EE" }}>{employees.length}</span></div>
          </div>
          <div style={{ ...s.card, marginTop: "1rem" }}>
            <div style={s.sectionTitle}>{isAr ? "التوظيف الجديد (30 يوماً)" : "Recently Hired (last 30 days)"}</div>
            {recentHires.length === 0 && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{isAr ? "لا يوجد موظفون جدد" : "No new hires in the last 30 days."}</p>}
            {recentHires.map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{e.first_name} {e.last_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{e.job_title} · {e.hire_date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...s.card, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={s.sectionTitle}>{isAr ? "طلبات الإجازة" : "Leave Requests"}</div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["all", "pending", "approved", "rejected"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f}</button>)}
            </div>
          </div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>{isAr ? "الموظف" : "Employee"}</th><th style={s.th}>{isAr ? "النوع" : "Type"}</th><th style={s.th}>{isAr ? "الفترة" : "Period"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: "var(--color-text-muted)" }}>{isAr ? "لا توجد طلبات إجازة" : "No leave requests."}</td></tr>}
              {filtered.map(l => (
                <tr key={l.id}>
                  <td style={s.td}><div style={{ fontWeight: 600 }}>{employees.find(e => e.id === l.employee) ? `${employees.find(e => e.id === l.employee)!.first_name} ${employees.find(e => e.id === l.employee)!.last_name}` : "Unknown"}</div></td>
                  <td style={s.td}>{l.leave_type}</td>
                  <td style={s.td}><div style={{ fontSize: "0.78rem" }}>{l.start_date} → {l.end_date}</div></td>
                  <td style={s.td}><span style={{ background: `${STATUS_COLOR[l.status]}22`, color: STATUS_COLOR[l.status], border: `1px solid ${STATUS_COLOR[l.status]}55`, borderRadius: 4, padding: "1px 7px", fontSize: "0.73rem", fontWeight: 600 }}>{l.status}</span></td>
                  <td style={s.td}>{l.status === "pending" && <div style={{ display: "flex", gap: 4 }}><button onClick={() => handleLeave(l.id, "approved")} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>✓</button><button onClick={() => handleLeave(l.id, "rejected")} style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>✗</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
