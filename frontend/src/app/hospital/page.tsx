"use client";

import { useState } from "react";

interface HospitalMetrics {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  icu_occupied: number;
  icu_total: number;
  ed_active: number;
  pending_admissions: number;
  pending_discharges: number;
  or_scheduled: number;
  capacity_pct: number;
}

interface WardSummary {
  name: string;
  name_ar: string;
  total: number;
  occupied: number;
  pending_discharge: number;
  status: "normal" | "elevated" | "critical";
}

const METRICS: HospitalMetrics = {
  total_beds: 320, occupied_beds: 278, available_beds: 42,
  icu_occupied: 18, icu_total: 24, ed_active: 31,
  pending_admissions: 8, pending_discharges: 14, or_scheduled: 9,
  capacity_pct: 86.9,
};

const WARDS: WardSummary[] = [
  { name: "Medical Ward A", name_ar: "جناح طبي أ", total: 48, occupied: 45, pending_discharge: 6, status: "critical" },
  { name: "Surgical Ward B", name_ar: "جناح جراحي ب", total: 40, occupied: 32, pending_discharge: 3, status: "elevated" },
  { name: "ICU", name_ar: "وحدة العناية المركزة", total: 24, occupied: 18, pending_discharge: 1, status: "elevated" },
  { name: "Maternity Ward", name_ar: "جناح الولادة", total: 36, occupied: 28, pending_discharge: 4, status: "normal" },
  { name: "Pediatrics", name_ar: "طب الأطفال", total: 32, occupied: 22, pending_discharge: 2, status: "normal" },
  { name: "Emergency Obs", name_ar: "طوارئ المراقبة", total: 20, occupied: 18, pending_discharge: 1, status: "critical" },
  { name: "Orthopedics", name_ar: "العظام", total: 28, occupied: 21, pending_discharge: 3, status: "normal" },
  { name: "Oncology", name_ar: "الأورام", total: 24, occupied: 19, pending_discharge: 1, status: "normal" },
];

function statusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "elevated") return "#f59e0b";
  return "#22c55e";
}

export default function HospitalPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [activeTab, setActiveTab] = useState<"overview" | "wards" | "ed" | "or">("overview");

  const capacityColor = METRICS.capacity_pct >= 90 ? "#ef4444" : METRICS.capacity_pct >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Hospital" : "مستشفى سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {lang === "en" ? "Hospital Operations Management" : "إدارة عمليات المستشفى"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ background: capacityColor + "22", border: `2px solid ${capacityColor}`, borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: capacityColor }}>{METRICS.capacity_pct}%</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Capacity" : "الطاقة"}</div>
          </div>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/hospital/adt", label: lang === "en" ? "ADT" : "القبول والخروج" },
          { href: "/hospital/beds", label: lang === "en" ? "Bed Management" : "إدارة الأسرة" },
          { href: "/hospital/emergency", label: lang === "en" ? "Emergency" : "الطوارئ" },
          { href: "/hospital/icu", label: lang === "en" ? "ICU" : "العناية المركزة" },
          { href: "/hospital/operating-room", label: lang === "en" ? "Operating Room" : "غرفة العمليات" },
          { href: "/hospital/command-center", label: lang === "en" ? "Command Center" : "مركز القيادة" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Key Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Total Beds" : "إجمالي الأسرة", value: METRICS.total_beds, color: "#6366f1" },
          { label: lang === "en" ? "Occupied" : "مشغولة", value: METRICS.occupied_beds, color: "#ef4444" },
          { label: lang === "en" ? "Available" : "متاحة", value: METRICS.available_beds, color: "#22c55e" },
          { label: lang === "en" ? "ICU Occupied" : "عناية مركزة", value: `${METRICS.icu_occupied}/${METRICS.icu_total}`, color: "#f59e0b" },
          { label: lang === "en" ? "ED Active" : "طوارئ نشطة", value: METRICS.ed_active, color: "#ec4899" },
          { label: lang === "en" ? "Pending Admit" : "انتظار قبول", value: METRICS.pending_admissions, color: "#8b5cf6" },
          { label: lang === "en" ? "Pending DC" : "انتظار خروج", value: METRICS.pending_discharges, color: "#14b8a6" },
          { label: lang === "en" ? "OR Scheduled" : "عمليات مجدولة", value: METRICS.or_scheduled, color: "#3b82f6" },
        ].map(m => (
          <div key={m.label} className="glass-card" style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Ward Census */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
        {lang === "en" ? "Ward Census" : "إحصاء الأجنحة"}
      </h2>
      <div className="glass-card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "Ward" : "الجناح",
                lang === "en" ? "Total" : "الكلي",
                lang === "en" ? "Occupied" : "مشغول",
                lang === "en" ? "Available" : "متاح",
                lang === "en" ? "Pending DC" : "خروج معلق",
                lang === "en" ? "Occupancy" : "الإشغال",
                lang === "en" ? "Status" : "الحالة",
              ].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WARDS.map((ward, i) => {
              const occ = Math.round((ward.occupied / ward.total) * 100);
              return (
                <tr key={ward.name} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{lang === "ar" ? ward.name_ar : ward.name}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{ward.total}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>{ward.occupied}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#22c55e", fontWeight: 600 }}>{ward.total - ward.occupied}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{ward.pending_discharge}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "6px", background: "var(--color-border)", borderRadius: "3px" }}>
                        <div style={{ width: `${occ}%`, height: "100%", background: statusColor(ward.status), borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: statusColor(ward.status), minWidth: "36px" }}>{occ}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: statusColor(ward.status) + "22", color: statusColor(ward.status), border: `1px solid ${statusColor(ward.status)}` }}>
                      {ward.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
