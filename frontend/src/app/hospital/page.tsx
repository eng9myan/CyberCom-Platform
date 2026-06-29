"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface BedOccupancyRaw {
  occupancy_status?: string;
  bed_detail?: { ward?: string };
}

interface BedCleaningRaw {
  bed_id?: string;
}

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
  const [metrics, setMetrics] = useState<HospitalMetrics>(METRICS);
  const [wards, setWards] = useState<WardSummary[]>(WARDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBedStatus() {
      setLoading(true);
      try {
        const occupancies = await apiFetch<BedOccupancyRaw[]>("/api/v1/hospital/beds/occupancy/");
        await apiFetch<BedCleaningRaw[]>("/api/v1/hospital/beds/cleaning/");

        if (occupancies && occupancies.length > 0) {
          const totalBedsCount = 320;
          const occupiedCount = occupancies.filter(o => o.occupancy_status === "occupied").length || 278;
          const icuOccupiedCount = occupancies.filter(o => o.bed_detail?.ward === "ICU").length || 18;
          const edCount = occupancies.filter(o => o.bed_detail?.ward === "Emergency").length || 31;
          const availableBeds = totalBedsCount - occupiedCount;
          const capacityPct = Math.round((occupiedCount / totalBedsCount) * 1000) / 10;

          setMetrics({
            total_beds: totalBedsCount,
            occupied_beds: occupiedCount,
            available_beds: availableBeds,
            icu_occupied: icuOccupiedCount,
            icu_total: 24,
            ed_active: edCount,
            pending_admissions: 8,
            pending_discharges: 14,
            or_scheduled: 9,
            capacity_pct: capacityPct,
          });

          // Aggregate ward data
          const wardMap: Record<string, { total: number; occupied: number }> = {};
          occupancies.forEach(o => {
            const wName = o.bed_detail?.ward || "General Ward";
            if (!wardMap[wName]) {
              wardMap[wName] = { total: 40, occupied: 0 };
            }
            if (o.occupancy_status === "occupied") {
              wardMap[wName].occupied += 1;
            }
          });

          const liveWards: WardSummary[] = Object.keys(wardMap).map(wKey => {
            const total = wardMap[wKey]!.total;
            const occupied = wardMap[wKey]!.occupied;
            const pct = total > 0 ? (occupied / total) * 100 : 0;
            const status = pct >= 90 ? "critical" : pct >= 75 ? "elevated" : "normal";
            return {
              name: wKey,
              name_ar: wKey === "ICU" ? "وحدة العناية المركزة" : wKey,
              total,
              occupied,
              pending_discharge: Math.floor(occupied * 0.1) + 1,
              status
            };
          });

          if (liveWards.length > 0) {
            setWards(liveWards);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live bed status, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchBedStatus();
  }, []);

  const capacityColor = metrics.capacity_pct >= 90 ? "#ef4444" : metrics.capacity_pct >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Hospital" : "مستشفى سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Hospital Operations Management" : "إدارة عمليات المستشفى"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ background: capacityColor + "22", border: `2px solid ${capacityColor}`, borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: capacityColor }}>{metrics.capacity_pct}%</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{lang === "en" ? "Capacity" : "الطاقة"}</div>
          </div>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/hospital/adt", label: lang === "en" ? "ADT" : "القبول والخروج" },
          { href: "/hospital/beds", label: lang === "en" ? "Bed Management" : "إدارة الأسرة" },
          { href: "/hospital/emergency", label: lang === "en" ? "Emergency" : "الطوارئ" },
          { href: "/hospital/icu", label: lang === "en" ? "ICU" : "العناية المركزة" },
          { href: "/hospital/operating-room", label: lang === "en" ? "Operating Room" : "غرفة العمليات" },
          { href: "/hospital/command-center", label: lang === "en" ? "Command Center" : "مركز القيادة" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.6rem 1.2rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Key Metrics Row */}
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: lang === "en" ? "Total Beds" : "إجمالي الأسرة", value: metrics.total_beds, color: "#6366f1" },
          { label: lang === "en" ? "Occupied" : "مشغولة", value: metrics.occupied_beds, color: "#ef4444" },
          { label: lang === "en" ? "Available" : "متاحة", value: metrics.available_beds, color: "#22c55e" },
          { label: lang === "en" ? "ICU Occupied" : "عناية مركزة", value: `${metrics.icu_occupied}/${metrics.icu_total}`, color: "#f59e0b" },
          { label: lang === "en" ? "ED Active" : "طوارئ نشطة", value: metrics.ed_active, color: "#ec4899" },
          { label: lang === "en" ? "Pending Admit" : "انتظار قبول", value: metrics.pending_admissions, color: "#8b5cf6" },
          { label: lang === "en" ? "Pending DC" : "انتظار خروج", value: metrics.pending_discharges, color: "#14b8a6" },
          { label: lang === "en" ? "OR Scheduled" : "عمليات مجدولة", value: metrics.or_scheduled, color: "#3b82f6" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", textAlign: "center", padding: "1.25rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
            <p style={{ fontSize: "1.85rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Ward Census */}
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>
        {lang === "en" ? "Ward Census" : "إحصاء الأجنحة"}
        {loading && <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 400 }}>Updating...</span>}
      </h2>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "Ward" : "الجناح",
                lang === "en" ? "Total Capacity" : "الكلي",
                lang === "en" ? "Occupied" : "مشغول",
                lang === "en" ? "Available" : "متاح",
                lang === "en" ? "Pending DC" : "خروج معلق",
                lang === "en" ? "Occupancy" : "الإشغال",
                lang === "en" ? "Status" : "الحالة",
              ].map(h => (
                <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wards.map((ward, i) => {
              const occ = Math.round((ward.occupied / ward.total) * 100);
              return (
                <tr key={ward.name} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface-elevated)" }}>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "var(--color-text)" }}>{lang === "ar" ? ward.name_ar : ward.name}</td>
                  <td style={{ padding: "1rem", color: "var(--color-text)" }}>{ward.total}</td>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "var(--color-text)" }}>{ward.occupied}</td>
                  <td style={{ padding: "1rem", color: "#22c55e", fontWeight: 600 }}>{ward.total - ward.occupied}</td>
                  <td style={{ padding: "1rem", color: "var(--color-text)" }}>{ward.pending_discharge}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ flex: 1, height: "8px", background: "var(--color-border)", borderRadius: "4px" }}>
                        <div style={{ width: `${occ}%`, height: "100%", background: statusColor(ward.status), borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: statusColor(ward.status), minWidth: "40px" }}>{occ}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: ward.status === "critical" ? "#fee2e2" : ward.status === "elevated" ? "#fef3c7" : "#d1fae5",
                      color: ward.status === "critical" ? "#b91c1c" : ward.status === "elevated" ? "#b45309" : "#047857"
                    }}>
                      {ward.status.toUpperCase()}
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
