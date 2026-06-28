"use client";

import { useState } from "react";

interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  ordered_by: string;
  panel_name: string;
  priority: "routine" | "urgent" | "stat";
  status: "ordered" | "collected" | "processing" | "resulted" | "verified" | "cancelled";
  ordered_at: string;
  tat_target_hours: number;
  tat_elapsed_hours: number;
}

interface LabMetrics {
  orders_today: number;
  pending: number;
  in_process: number;
  resulted: number;
  critical_pending: number;
  avg_tat_hours: number;
  specimens_collected: number;
  qc_failures: number;
}

const METRICS: LabMetrics = {
  orders_today: 247, pending: 34, in_process: 89,
  resulted: 124, critical_pending: 3, avg_tat_hours: 2.4,
  specimens_collected: 198, qc_failures: 2,
};

const ORDERS: LabOrder[] = [
  { id: "1", order_number: "LAB-2026-8841", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", ordered_by: "Dr. Nadia Karimi", panel_name: "Complete Blood Count", priority: "stat", status: "processing", ordered_at: "08:45", tat_target_hours: 1, tat_elapsed_hours: 0.8 },
  { id: "2", order_number: "LAB-2026-8842", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", ordered_by: "Dr. Ibrahim Yousif", panel_name: "Comprehensive Metabolic Panel", priority: "urgent", status: "collected", ordered_at: "09:10", tat_target_hours: 2, tat_elapsed_hours: 1.2 },
  { id: "3", order_number: "LAB-2026-8843", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", ordered_by: "Dr. Sara Hassan", panel_name: "HbA1c", priority: "routine", status: "resulted", ordered_at: "07:30", tat_target_hours: 4, tat_elapsed_hours: 3.5 },
  { id: "4", order_number: "LAB-2026-8844", patient_name: "Leila Nouri", patient_name_ar: "ليلى نوري", mrn: "MRN-004524", ordered_by: "Dr. Khalid Al-Rashid", panel_name: "Thyroid Panel", priority: "urgent", status: "ordered", ordered_at: "09:45", tat_target_hours: 3, tat_elapsed_hours: 0.3 },
  { id: "5", order_number: "LAB-2026-8845", patient_name: "Omar Hassan", patient_name_ar: "عمر حسن", mrn: "MRN-004525", ordered_by: "Dr. Aisha Mohammed", panel_name: "Blood Culture x2", priority: "stat", status: "processing", ordered_at: "08:00", tat_target_hours: 48, tat_elapsed_hours: 2.1 },
];

function priorityColor(p: string) {
  if (p === "stat") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    ordered: "#6b7280", collected: "#3b82f6", processing: "#f59e0b",
    resulted: "#8b5cf6", verified: "#22c55e", cancelled: "#ef4444",
  };
  return map[s] || "#6b7280";
}

function tatColor(elapsed: number, target: number) {
  const pct = elapsed / target;
  if (pct >= 1) return "#ef4444";
  if (pct >= 0.8) return "#f59e0b";
  return "#22c55e";
}

export default function LaboratoryPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "stat" | "urgent" | "routine">("all");

  const filtered = priorityFilter === "all" ? ORDERS : ORDERS.filter(o => o.priority === priorityFilter);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Laboratory" : "مختبر سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {lang === "en" ? "Laboratory Information System" : "نظام معلومات المختبر"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {METRICS.critical_pending > 0 && (
            <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 700, color: "#dc2626" }}>
              ⚠ {METRICS.critical_pending} {lang === "en" ? "Critical Pending" : "حرجة معلقة"}
            </div>
          )}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/laboratory/orders", label: lang === "en" ? "Orders" : "الطلبات" },
          { href: "/laboratory/specimens", label: lang === "en" ? "Specimens" : "العينات" },
          { href: "/laboratory/worklists", label: lang === "en" ? "Worklists" : "قوائم العمل" },
          { href: "/laboratory/results", label: lang === "en" ? "Results" : "النتائج" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Orders Today" : "طلبات اليوم", value: METRICS.orders_today, color: "#6366f1" },
          { label: lang === "en" ? "Pending" : "معلقة", value: METRICS.pending, color: "#f59e0b" },
          { label: lang === "en" ? "In Process" : "قيد المعالجة", value: METRICS.in_process, color: "#3b82f6" },
          { label: lang === "en" ? "Resulted" : "ذات نتائج", value: METRICS.resulted, color: "#22c55e" },
          { label: lang === "en" ? "Critical Pending" : "حرجة معلقة", value: METRICS.critical_pending, color: "#ef4444" },
          { label: lang === "en" ? "Avg TAT (hrs)" : "متوسط وقت الإنجاز", value: METRICS.avg_tat_hours, color: "#8b5cf6" },
          { label: lang === "en" ? "Specimens" : "العينات", value: METRICS.specimens_collected, color: "#14b8a6" },
          { label: lang === "en" ? "QC Failures" : "إخفاقات الجودة", value: METRICS.qc_failures, color: METRICS.qc_failures > 0 ? "#ef4444" : "#22c55e" },
        ].map(m => (
          <div key={m.label} className="glass-card" style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{lang === "en" ? "Active Lab Orders" : "طلبات المختبر النشطة"}</h2>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["all", "stat", "urgent", "routine"] as const).map(f => (
            <button key={f} onClick={() => setPriorityFilter(f)} style={{ padding: "0.3rem 0.75rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.8rem", background: priorityFilter === f ? priorityColor(f === "all" ? "routine" : f) : "var(--color-surface)", color: priorityFilter === f ? "#fff" : "var(--color-text)" }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {["Order #", "Patient", "Test/Panel", "Priority", "Status", "TAT Progress", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order, i) => (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface)" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", fontFamily: "monospace", color: "var(--color-primary)" }}>{order.order_number}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? order.patient_name_ar : order.patient_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{order.mrn}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: "0.875rem" }}>{order.panel_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{order.ordered_by}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: priorityColor(order.priority) + "22", color: priorityColor(order.priority), border: `1px solid ${priorityColor(order.priority)}` }}>
                    {order.priority.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: statusColor(order.status) + "22", color: statusColor(order.status) }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem", minWidth: "140px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ flex: 1, height: "6px", background: "var(--color-border)", borderRadius: "3px" }}>
                      <div style={{ width: `${Math.min(100, (order.tat_elapsed_hours / order.tat_target_hours) * 100)}%`, height: "100%", background: tatColor(order.tat_elapsed_hours, order.tat_target_hours), borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: tatColor(order.tat_elapsed_hours, order.tat_target_hours), minWidth: "50px" }}>
                      {order.tat_elapsed_hours}h/{order.tat_target_hours}h
                    </span>
                  </div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <button style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", borderRadius: "4px", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}>
                    {lang === "en" ? "View" : "عرض"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
