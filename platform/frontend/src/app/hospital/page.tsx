"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface CommandCenterSnapshot {
  operational_census: {
    active_admissions: number;
    current_occupied_beds: number;
    total_beds: number;
    emergency_waiting: number;
    icu_occupancy: number;
    scheduled_procedures_today: number;
  };
  capacity_indicators: {
    bed_occupancy_percentage: number;
  };
}

interface TrendPoint {
  date: string;
  admissions: number;
  discharges: number;
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

function statusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "elevated") return "#f59e0b";
  return "#22c55e";
}

export default function HospitalPortal() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [metrics, setMetrics] = useState<HospitalMetrics | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [wards] = useState<WardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !session) {
      setFetchError(null);
      return;
    }

    async function fetchDashboardData() {
      setLoading(true);
      setFetchError(null);
      try {
        const [snapshot, trendSeries] = await Promise.all([
          apiFetch<CommandCenterSnapshot>("/api/v1/hospital/command-center/metrics/", {
            token: session!.accessToken,
            tenantId: session!.tenantId,
          }),
          apiFetch<TrendPoint[]>("/api/v1/hospital/command-center/trend/", {
            token: session!.accessToken,
            tenantId: session!.tenantId,
          }),
        ]);
        const census = snapshot.operational_census;
        setMetrics({
          total_beds: census.total_beds,
          occupied_beds: census.current_occupied_beds,
          available_beds: census.total_beds - census.current_occupied_beds,
          icu_occupied: census.icu_occupancy,
          icu_total: census.icu_occupancy,
          ed_active: census.emergency_waiting,
          pending_admissions: census.active_admissions,
          pending_discharges: 0,
          or_scheduled: census.scheduled_procedures_today,
          capacity_pct: snapshot.capacity_indicators.bed_occupancy_percentage,
        });
        setTrend(trendSeries);
      } catch (err) {
        // Real API errors surface here -- never silently substitute invented
        // numbers. The UI shows an explicit error state instead.
        const detail = (err as { detail?: string })?.detail;
        setFetchError(detail || (err instanceof Error ? err.message : "Failed to load live hospital data."));
      } finally {
        setLoading(false);
      }
    }
    void fetchDashboardData();
  }, [isAuthenticated, session]);

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "4rem auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          {lang === "en" ? "Sign in required" : "تسجيل الدخول مطلوب"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          {lang === "en"
            ? "Hospital operations data requires an authenticated CyIdentity session."
            : "بيانات عمليات المستشفى تتطلب جلسة مصادقة CyIdentity."}
        </p>
        <a href="/auth" style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "var(--color-primary)", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
          {lang === "en" ? "Go to login" : "الذهاب لتسجيل الدخول"}
        </a>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "4rem auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#ef4444" }}>
          {lang === "en" ? "Unable to load hospital data" : "تعذر تحميل بيانات المستشفى"}
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? "Loading live hospital data..." : "جاري تحميل بيانات المستشفى..."}
      </div>
    );
  }

  const capacityColor = metrics.capacity_pct >= 90 ? "#ef4444" : metrics.capacity_pct >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {lang === "en" ? "Command Overview" : "نظرة عامة على القيادة"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Live hospital operations" : "عمليات المستشفى المباشرة"}
            {loading && <span style={{ marginLeft: "0.75rem" }}>Updating...</span>}
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

      {/* Key Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
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

      {/* Weekly Trend */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>
        {lang === "en" ? "Admissions vs. Discharges (7 days)" : "القبول مقابل الخروج (7 أيام)"}
      </h2>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "2.5rem", height: "300px" }}>
        {trend && trend.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
              />
              <Legend />
              <Line type="monotone" dataKey="admissions" stroke="#6366f1" strokeWidth={2} name={lang === "en" ? "Admissions" : "القبول"} />
              <Line type="monotone" dataKey="discharges" stroke="#14b8a6" strokeWidth={2} name={lang === "en" ? "Discharges" : "الخروج"} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "Loading trend data..." : "جاري تحميل بيانات الاتجاه..."}
          </div>
        )}
      </div>

      {/* Ward Census */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>
        {lang === "en" ? "Ward Census" : "إحصاء الأجنحة"}
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
            {wards.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  {lang === "en"
                    ? "Ward-level breakdown is not wired up yet -- only tenant-wide totals above are live."
                    : "تفصيل الأجنحة غير متاح بعد -- الإجماليات أعلاه فقط مباشرة."}
                </td>
              </tr>
            )}
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
