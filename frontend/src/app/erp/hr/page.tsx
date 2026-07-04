"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface LeaveRequest { id: string; employee: string; employee_ar: string; department: string; type: string; from: string; to: string; days: number; status: "pending" | "approved" | "rejected"; }
const MOCK_DEPT = [
  { dept: "Medical Staff", dept_ar: "الكادر الطبي", physicians: 120, nurses: 180, total: 300 },
  { dept: "Administration", dept_ar: "الإدارة", physicians: 0, nurses: 0, total: 90 },
  { dept: "Support Services", dept_ar: "الخدمات المساندة", physicians: 0, nurses: 0, total: 60 },
];
const MOCK_ONBOARDING = [
  { name: "Dr. Layla Hassan", name_ar: "د. ليلى حسن", role: "Intensivist", start: "2026-07-15", progress: 60 },
  { name: "Nora Al-Zahrani", name_ar: "نورة الزهراني", role: "Registered Nurse", start: "2026-07-10", progress: 80 },
  { name: "Faisal Al-Ghamdi", name_ar: "فيصل الغامدي", role: "Medical Coder", start: "2026-07-08", progress: 95 },
];
const MOCK_LEAVES: LeaveRequest[] = [
  { id: "lv01", employee: "Sara Al-Harbi", employee_ar: "سارة الحربي", department: "Nursing", type: "Annual Leave", from: "2026-07-10", to: "2026-07-17", days: 7, status: "pending" },
  { id: "lv02", employee: "Khalid Al-Sayed", employee_ar: "خالد السيد", department: "Pharmacy", type: "Sick Leave", from: "2026-07-02", to: "2026-07-04", days: 3, status: "approved" },
  { id: "lv03", employee: "Reem Al-Malki", employee_ar: "ريم المالكي", department: "Radiology", type: "Annual Leave", from: "2026-07-15", to: "2026-07-22", days: 7, status: "pending" },
  { id: "lv04", employee: "Badr Al-Rashidi", employee_ar: "بدر الرشيدي", department: "ICU", type: "Emergency Leave", from: "2026-07-01", to: "2026-07-03", days: 2, status: "approved" },
  { id: "lv05", employee: "Waleed Al-Bishi", employee_ar: "وليد البيشي", department: "Lab", type: "Annual Leave", from: "2026-08-01", to: "2026-08-15", days: 14, status: "pending" },
  { id: "lv06", employee: "Dalal Al-Zahrani", employee_ar: "دلال الزهراني", department: "HR", type: "Maternity Leave", from: "2026-07-20", to: "2026-10-20", days: 90, status: "approved" },
  { id: "lv07", employee: "Faris Al-Ghamdi", employee_ar: "فارس الغامدي", department: "Finance", type: "Annual Leave", from: "2026-07-25", to: "2026-07-29", days: 4, status: "rejected" },
  { id: "lv08", employee: "Afnan Al-Otaibi", employee_ar: "أفنان العتيبي", department: "Clinic", type: "Sick Leave", from: "2026-07-01", to: "2026-07-01", days: 1, status: "approved" },
  { id: "lv09", employee: "Mona Al-Harbi", employee_ar: "منى الحربي", department: "Administration", type: "Annual Leave", from: "2026-08-05", to: "2026-08-12", days: 7, status: "pending" },
  { id: "lv10", employee: "Ibrahim Al-Harthy", employee_ar: "إبراهيم الحارثي", department: "Surgery", type: "Conference Leave", from: "2026-07-18", to: "2026-07-20", days: 3, status: "pending" },
  { id: "lv11", employee: "Hessa Al-Mutairi", employee_ar: "حصة المطيري", department: "ED", type: "Sick Leave", from: "2026-07-02", to: "2026-07-02", days: 1, status: "approved" },
  { id: "lv12", employee: "Tariq Al-Shammari", employee_ar: "طارق الشمري", department: "Orthopedics", type: "Annual Leave", from: "2026-09-01", to: "2026-09-14", days: 14, status: "pending" },
];
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444" };

export default function HRPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<LeaveRequest[]>("/api/v1/erp/hr/leave-requests/").then(d => { if (d && d.length) setLeaves(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLeave = async (id: string, action: "approve" | "reject") => {
    try { await apiFetch(`/api/v1/erp/hr/leave-requests/${id}/${action}/`, { method: "POST" }); } catch {}
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: action === "approve" ? "approved" as const : "rejected" as const } : l));
  };

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
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>450 {isAr ? "موظف" : "staff"} · {pending.length} {isAr ? "طلب إجازة معلق" : "pending leave requests"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.twoCol}>
        <div>
          <div style={s.card}>
            <div style={s.sectionTitle}>{isAr ? "القوى العاملة حسب القسم" : "Headcount by Department"}</div>
            {MOCK_DEPT.map(d => <div key={d.dept} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}><span style={{ fontSize: "0.875rem" }}>{isAr ? d.dept_ar : d.dept}</span><span style={{ fontWeight: 700, color: "#22D3EE" }}>{d.total}</span></div>)}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700 }}><span>{isAr ? "الإجمالي" : "Total"}</span><span style={{ color: "#22D3EE" }}>450</span></div>
          </div>
          <div style={{ ...s.card, marginTop: "1rem" }}>
            <div style={s.sectionTitle}>{isAr ? "التأهيل والانضمام" : "Onboarding"}</div>
            {MOCK_ONBOARDING.map(e => <div key={e.name} style={{ marginBottom: "0.75rem" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><div><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{isAr ? e.name_ar : e.name}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{e.role} · {e.start}</div></div><span style={{ fontWeight: 700, color: "#22D3EE" }}>{e.progress}%</span></div><div style={{ height: 6, background: "var(--color-background)", borderRadius: 3 }}><div style={{ width: `${e.progress}%`, height: "100%", background: "#22D3EE", borderRadius: 3 }} /></div></div>)}
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
            <thead><tr><th style={s.th}>{isAr ? "الموظف" : "Employee"}</th><th style={s.th}>{isAr ? "القسم" : "Dept"}</th><th style={s.th}>{isAr ? "النوع" : "Type"}</th><th style={s.th}>{isAr ? "الفترة" : "Period"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
            <tbody>{filtered.map(l => <tr key={l.id}><td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? l.employee_ar : l.employee}</div></td><td style={s.td}>{l.department}</td><td style={s.td}>{l.type}</td><td style={s.td}><div style={{ fontSize: "0.78rem" }}>{l.from} → {l.to}</div><div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{l.days} {isAr ? "أيام" : "days"}</div></td><td style={s.td}><span style={{ background: `${STATUS_COLOR[l.status]}22`, color: STATUS_COLOR[l.status], border: `1px solid ${STATUS_COLOR[l.status]}55`, borderRadius: 4, padding: "1px 7px", fontSize: "0.73rem", fontWeight: 600 }}>{l.status}</span></td><td style={s.td}>{l.status === "pending" && <div style={{ display: "flex", gap: 4 }}><button onClick={() => handleLeave(l.id, "approve")} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>✓</button><button onClick={() => handleLeave(l.id, "reject")} style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>✗</button></div>}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
