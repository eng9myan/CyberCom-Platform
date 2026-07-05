"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "acknowledged" | "resolved";

interface CapacityAlert {
  id: string;
  category: string;
  category_ar: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  severity: AlertSeverity;
  status: AlertStatus;
  ward?: string;
  ward_ar?: string;
  value?: number;
  threshold?: number;
  unit?: string;
  time_raised: string;
  owner: string;
}

interface PendingAction {
  id: string;
  action: string;
  action_ar: string;
  patient?: string;
  patient_ar?: string;
  mrn?: string;
  ward: string;
  ward_ar: string;
  priority: "urgent" | "routine" | "deferred";
  due: string;
  assigned_to: string;
  completed: boolean;
}

interface KPI {
  label: string;
  label_ar: string;
  value: string | number;
  unit?: string;
  trend: "up" | "down" | "stable";
  trend_value: string;
  good_direction: "up" | "down";
  color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALERTS: CapacityAlert[] = [
  { id: "ALT001", category: "Capacity", category_ar: "الطاقة", title: "Medical Ward A — Critical Occupancy", title_ar: "الجناح الطبي أ — إشغال حرج", description: "Medical Ward A is at 95% occupancy (19/20 beds). No available beds for new admissions.", description_ar: "الجناح الطبي أ عند 95% إشغال (19/20 سرير). لا أسرة متاحة.", severity: "critical", status: "active", ward: "Medical Ward A", ward_ar: "الجناح الطبي أ", value: 95, threshold: 90, unit: "%", time_raised: "2026-06-30 08:10", owner: "Bed Management" },
  { id: "ALT002", category: "Capacity", category_ar: "الطاقة", title: "Emergency Obs — Full Capacity", title_ar: "طوارئ المراقبة — مكتملة", description: "Emergency Observation is at 100% capacity. 3 ED patients boarding, awaiting ward beds.", description_ar: "طوارئ المراقبة مكتملة. 3 مرضى طوارئ ينتظرون أسرة في الأجنحة.", severity: "critical", status: "active", ward: "Emergency Obs", ward_ar: "طوارئ المراقبة", value: 100, threshold: 90, unit: "%", time_raised: "2026-06-30 07:45", owner: "Emergency Dept" },
  { id: "ALT003", category: "Discharge", category_ar: "الخروج", title: "14 Pending Discharges — >6 Hours", title_ar: "14 خروجاً معلقاً أكثر من 6 ساعات", description: "14 patients have discharge orders older than 6 hours pending. Bed turnover is delayed.", description_ar: "14 مريضاً لديهم أوامر خروج منذ أكثر من 6 ساعات معلقة.", severity: "high", status: "active", value: 14, threshold: 10, unit: "patients", time_raised: "2026-06-30 07:00", owner: "Discharge Coordination" },
  { id: "ALT004", category: "Emergency", category_ar: "الطوارئ", title: "ED Boarding: 6 Patients Awaiting Admission", title_ar: "6 مرضى طوارئ ينتظرون القبول", description: "6 ED patients have been boarded for over 4 hours. Average boarding time: 5.2 hours.", description_ar: "6 مرضى في الطوارئ ينتظرون منذ أكثر من 4 ساعات. متوسط وقت الانتظار: 5.2 ساعة.", severity: "high", status: "acknowledged", value: 5.2, threshold: 4, unit: "hours", time_raised: "2026-06-30 05:30", owner: "ED Charge Nurse" },
  { id: "ALT005", category: "OR", category_ar: "غرفة العمليات", title: "OR-4 Schedule Delay — 45 Minutes", title_ar: "تأخر برنامج غرفة العمليات 4 — 45 دقيقة", description: "OR Room 4 is running 45 minutes behind schedule. 2 afternoon cases affected.", description_ar: "غرفة العمليات 4 متأخرة 45 دقيقة عن البرنامج. 2 حالات بعد الظهر متأثرة.", severity: "medium", status: "active", ward: "OR Block", ward_ar: "وحدة العمليات", value: 45, threshold: 30, unit: "min delay", time_raised: "2026-06-30 09:00", owner: "OR Coordinator" },
  { id: "ALT006", category: "ICU", category_ar: "العناية المركزة", title: "ICU at 87.5% — Approaching Threshold", title_ar: "العناية المركزة عند 87.5% — نحو العتبة الحرجة", description: "ICU is at 87.5% occupancy (21/24 beds). Consider step-down protocols.", description_ar: "العناية المركزة عند 87.5% (21/24 سرير). يُوصى بتطبيق بروتوكول التنزيل.", severity: "medium", status: "active", ward: "ICU", ward_ar: "العناية المركزة", value: 87.5, threshold: 85, unit: "%", time_raised: "2026-06-30 08:30", owner: "ICU Charge Nurse" },
  { id: "ALT007", category: "Staffing", category_ar: "الكوادر", title: "Night Shift Nurse Shortage — Medical Ward B", title_ar: "نقص ممرضات ليلي — الجناح الطبي ب", description: "Night shift on Medical Ward B is 2 nurses short of required ratio.", description_ar: "نوبة الليل في الجناح الطبي ب تفتقر لممرضتين عن النسبة المطلوبة.", severity: "medium", status: "acknowledged", time_raised: "2026-06-30 06:00", owner: "Nursing Supervisor" },
  { id: "ALT008", category: "Throughput", category_ar: "الإنتاجية", title: "Radiology Turnaround > 90 min", title_ar: "وقت استجابة الأشعة أكثر من 90 دقيقة", description: "Average radiology report turnaround has risen to 92 minutes. Target is <60 minutes.", description_ar: "متوسط وقت استجابة الأشعة ارتفع إلى 92 دقيقة. الهدف أقل من 60 دقيقة.", severity: "low", status: "resolved", value: 92, threshold: 60, unit: "minutes", time_raised: "2026-06-30 07:20", owner: "Radiology Dept" },
];

const MOCK_ACTIONS: PendingAction[] = [
  { id: "ACT001", action: "Expedite discharge — Ibrahim Al-Shammari", action_ar: "تسريع خروج إبراهيم الشمري", patient: "Ibrahim Al-Shammari", patient_ar: "إبراهيم الشمري", mrn: "MRN-09812", ward: "Medical Ward A", ward_ar: "الجناح الطبي أ", priority: "urgent", due: "10:00", assigned_to: "Dr. Khalid Mansour", completed: false },
  { id: "ACT002", action: "Identify step-down candidate from ICU", action_ar: "تحديد مرشح للتنزيل من العناية المركزة", ward: "ICU", ward_ar: "العناية المركزة", priority: "urgent", due: "11:00", assigned_to: "Dr. Reem Al-Jabri", completed: false },
  { id: "ACT003", action: "Arrange transfer of 3 ED boarding patients", action_ar: "ترتيب نقل 3 مرضى طوارئ منتظرين", ward: "Emergency Obs", ward_ar: "طوارئ المراقبة", priority: "urgent", due: "10:30", assigned_to: "Bed Management Team", completed: false },
  { id: "ACT004", action: "Schedule Environmental Services for Ward A beds", action_ar: "جدولة خدمات البيئة لأسرة الجناح أ", ward: "Medical Ward A", ward_ar: "الجناح الطبي أ", priority: "routine", due: "12:00", assigned_to: "EVS Supervisor", completed: false },
  { id: "ACT005", action: "Reassign OR-4 afternoon cases to OR-6", action_ar: "إعادة جدولة حالات غرفة 4 إلى غرفة 6", ward: "OR Block", ward_ar: "وحدة العمليات", priority: "urgent", due: "11:30", assigned_to: "OR Coordinator", completed: false },
  { id: "ACT006", action: "Obtain Discharge orders — Maryam Al-Balushi", action_ar: "الحصول على أوامر خروج مريم البلوشي", patient: "Maryam Al-Balushi", patient_ar: "مريم البلوشي", mrn: "MRN-09956", ward: "Maternity Ward", ward_ar: "جناح الولادة", priority: "routine", due: "12:00", assigned_to: "Dr. Nour Al-Hassan", completed: true },
  { id: "ACT007", action: "Request additional portering for patient transfers", action_ar: "طلب عمال نقل إضافيين", ward: "All Wards", ward_ar: "جميع الأجنحة", priority: "routine", due: "14:00", assigned_to: "Patient Services", completed: false },
  { id: "ACT008", action: "Night shift coverage — Medical Ward B", action_ar: "تغطية نوبة ليلي — الجناح الطبي ب", ward: "Medical Ward B", ward_ar: "الجناح الطبي ب", priority: "deferred", due: "18:00", assigned_to: "Nursing Supervisor", completed: false },
];

const MOCK_KPIS: KPI[] = [
  { label: "Overall Capacity", label_ar: "الطاقة الكلية", value: 86.9, unit: "%", trend: "up", trend_value: "+2.1% vs yesterday", good_direction: "down", color: "#f59e0b" },
  { label: "ED Door-to-Doctor", label_ar: "وقت الطوارئ للطبيب", value: 38, unit: "min", trend: "down", trend_value: "-5 min vs last week", good_direction: "down", color: "#22c55e" },
  { label: "ED Boarding Time", label_ar: "وقت انتظار الطوارئ", value: "5.2", unit: "hrs avg", trend: "up", trend_value: "+1.1h vs target", good_direction: "down", color: "#ef4444" },
  { label: "Discharge Before Noon", label_ar: "خروج قبل الظهر", value: 42, unit: "%", trend: "down", trend_value: "-8% vs target (60%)", good_direction: "up", color: "#ef4444" },
  { label: "ALOS (All Wards)", label_ar: "متوسط مدة الإقامة", value: 4.3, unit: "days", trend: "stable", trend_value: "Target ≤4.5 days", good_direction: "down", color: "#22c55e" },
  { label: "OR Utilization", label_ar: "استخدام غرف العمليات", value: 78, unit: "%", trend: "down", trend_value: "-4% from target (85%)", good_direction: "up", color: "#f59e0b" },
  { label: "Patient Throughput", label_ar: "معدل إنجاز المرضى", value: 31, unit: "today", trend: "up", trend_value: "+3 vs yesterday", good_direction: "up", color: "#22c55e" },
  { label: "Pending Discharges", label_ar: "خروج معلق", value: 14, unit: "patients", trend: "up", trend_value: "+4 vs 10:00", good_direction: "down", color: "#ef4444" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<AlertSeverity, { bg: string; border: string; badge: string; badgeBg: string }> = {
  critical: { bg: "#1f0a0a", border: "#ef4444", badge: "#ef4444", badgeBg: "#fee2e222" },
  high:     { bg: "#1c110a", border: "#f97316", badge: "#f97316", badgeBg: "#fff7ed22" },
  medium:   { bg: "#1c1610", border: "#f59e0b", badge: "#f59e0b", badgeBg: "#fef3c722" },
  low:      { bg: "#0d1117", border: "#6b7280", badge: "#9ca3af", badgeBg: "#f3f4f622" },
};

const STATUS_STYLE: Record<AlertStatus, { color: string; label_en: string; label_ar: string }> = {
  active:       { color: "#ef4444", label_en: "Active", label_ar: "نشط" },
  acknowledged: { color: "#f59e0b", label_en: "Acknowledged", label_ar: "مُسجَّل" },
  resolved:     { color: "#22c55e", label_en: "Resolved", label_ar: "محلول" },
};

const PRIORITY_COLOR = { urgent: "#ef4444", routine: "#f59e0b", deferred: "#6b7280" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [alerts, setAlerts] = useState<CapacityAlert[]>(MOCK_ALERTS);
  const [actions, setActions] = useState<PendingAction[]>(MOCK_ACTIONS);
  const [kpis] = useState<KPI[]>(MOCK_KPIS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "actions" | "kpis">("alerts");
  const [filterSeverity, setFilterSeverity] = useState<"all" | AlertSeverity>("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const alertData = await apiFetch<CapacityAlert[]>("/api/v1/hospital/command-center/alerts/");
        if (alertData && alertData.length > 0) setAlerts(alertData);
        const actionData = await apiFetch<PendingAction[]>("/api/v1/hospital/command-center/actions/");
        if (actionData && actionData.length > 0) setActions(actionData);
      } catch {
        // silently use mock data
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  const activeAlerts = alerts.filter(a => a.status === "active").length;
  const criticalAlerts = alerts.filter(a => a.severity === "critical" && a.status === "active").length;
  const pendingActions = actions.filter(a => !a.completed).length;
  const urgentActions = actions.filter(a => a.priority === "urgent" && !a.completed).length;

  const filteredAlerts = filterSeverity === "all" ? alerts : alerts.filter(a => a.severity === filterSeverity);

  function acknowledgeAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id && a.status === "active" ? { ...a, status: "acknowledged" } : a));
  }

  function resolveAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));
  }

  function toggleAction(id: string) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  }

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Clinical Command Center" : "مركز القيادة السريرية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Real-time capacity, alerts and operational KPIs" : "الطاقة الفورية والتنبيهات ومؤشرات الأداء"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {criticalAlerts > 0 && (
            <div style={{ background: "#fee2e2", border: "2px solid #ef4444", borderRadius: "8px", padding: "0.4rem 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#b91c1c" }}>{criticalAlerts} {lang === "en" ? "CRITICAL" : "حرجة"}</span>
            </div>
          )}
          {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Live...</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>


      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Active Alerts" : "تنبيهات نشطة", value: activeAlerts, color: "#ef4444" },
          { label: lang === "en" ? "Critical Alerts" : "تنبيهات حرجة", value: criticalAlerts, color: "#ef4444" },
          { label: lang === "en" ? "Pending Actions" : "إجراءات معلقة", value: pendingActions, color: "#f59e0b" },
          { label: lang === "en" ? "Urgent Actions" : "إجراءات عاجلة", value: urgentActions, color: "#f97316" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: `1px solid ${card.color}44`, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-border)" }}>
        {(["alerts", "actions", "kpis"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: "0.625rem 1.25rem", border: "none", borderBottom: activeTab === tab ? "3px solid #22D3EE" : "3px solid transparent", background: "transparent", color: activeTab === tab ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", marginBottom: "-2px" }}
          >
            {tab === "alerts" ? (lang === "en" ? "Capacity Alerts" : "تنبيهات الطاقة") :
             tab === "actions" ? (lang === "en" ? "Pending Actions" : "الإجراءات المعلقة") :
             (lang === "en" ? "KPIs & Metrics" : "مؤشرات الأداء")}
          </button>
        ))}
      </div>

      {/* ALERTS TAB */}
      {activeTab === "alerts" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {(["all", "critical", "high", "medium", "low"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                style={{ padding: "0.35rem 0.875rem", borderRadius: "20px", border: filterSeverity === s ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: filterSeverity === s ? "#22D3EE22" : "var(--color-surface)", color: filterSeverity === s ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}
              >
                {s === "all" ? (lang === "en" ? "All" : "الكل") : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {filteredAlerts.map(alert => {
              const sty = SEVERITY_STYLE[alert.severity];
              const sts = STATUS_STYLE[alert.status];
              return (
                <div key={alert.id} style={{ background: sty.bg, border: `1px solid ${sty.border}`, borderRadius: "12px", padding: "1.25rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "20px", background: sty.badgeBg, color: sty.badge, textTransform: "uppercase" }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}>
                        {lang === "ar" ? alert.category_ar : alert.category}
                      </span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: sts.color }}>● {lang === "ar" ? sts.label_ar : sts.label_en}</span>
                    </div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.35rem 0" }}>
                      {lang === "ar" ? alert.title_ar : alert.title}
                    </h3>
                    <p style={{ fontSize: "0.83rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>
                      {lang === "ar" ? alert.description_ar : alert.description}
                    </p>
                    <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                      <span>{lang === "en" ? "Raised" : "أُثيرت"}: {alert.time_raised}</span>
                      <span>{lang === "en" ? "Owner" : "المسؤول"}: {alert.owner}</span>
                      {alert.value !== undefined && <span>{lang === "en" ? "Current" : "الحالي"}: <span style={{ color: sty.badge, fontWeight: 700 }}>{alert.value}{alert.unit}</span> ({lang === "en" ? "threshold" : "العتبة"}: {alert.threshold}{alert.unit})</span>}
                    </div>
                  </div>
                  {alert.status !== "resolved" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                      {alert.status === "active" && (
                        <button onClick={() => acknowledgeAlert(alert.id)} style={{ padding: "0.4rem 0.875rem", background: "#f59e0b22", border: "1px solid #f59e0b", borderRadius: "6px", color: "#f59e0b", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                          {lang === "en" ? "Acknowledge" : "تسجيل"}
                        </button>
                      )}
                      <button onClick={() => resolveAlert(alert.id)} style={{ padding: "0.4rem 0.875rem", background: "#052e1622", border: "1px solid #22c55e", borderRadius: "6px", color: "#22c55e", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {lang === "en" ? "Resolve" : "حل"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIONS TAB */}
      {activeTab === "actions" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {[lang === "en" ? "Done" : "منجز", lang === "en" ? "Priority" : "الأولوية", lang === "en" ? "Action" : "الإجراء", lang === "en" ? "Ward" : "الجناح", lang === "en" ? "Due" : "الموعد", lang === "en" ? "Assigned To" : "المكلف"].map(h => (
                  <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((act, i) => (
                <tr key={act.id} style={{ borderBottom: "1px solid var(--color-border)", background: act.completed ? "rgba(34,197,94,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", opacity: act.completed ? 0.6 : 1 }}>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <input type="checkbox" checked={act.completed} onChange={() => toggleAction(act.id)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#22D3EE" }} />
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: PRIORITY_COLOR[act.priority] + "22", color: PRIORITY_COLOR[act.priority] }}>
                      {lang === "en" ? act.priority.toUpperCase() : act.priority === "urgent" ? "عاجل" : act.priority === "routine" ? "اعتيادي" : "مؤجل"}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 500, color: act.completed ? "var(--color-text-muted)" : "var(--color-text)", fontSize: "0.875rem", textDecoration: act.completed ? "line-through" : "none" }}>
                    {lang === "ar" ? act.action_ar : act.action}
                    {act.mrn && <div style={{ fontSize: "0.75rem", color: "#22D3EE", marginTop: "2px" }}>{act.mrn}</div>}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "ar" ? act.ward_ar : act.ward}</td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{act.due}</td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{act.assigned_to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KPIs TAB */}
      {activeTab === "kpis" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {kpis.map(kpi => {
            const isBad = kpi.trend !== "stable" && ((kpi.good_direction === "down" && kpi.trend === "up") || (kpi.good_direction === "up" && kpi.trend === "down"));
            const trendColor = kpi.trend === "stable" ? "#6b7280" : isBad ? "#ef4444" : "#22c55e";
            const trendIcon = kpi.trend === "up" ? "↑" : kpi.trend === "down" ? "↓" : "→";
            return (
              <div key={kpi.label} style={{ background: "var(--color-surface)", border: `1px solid ${kpi.color}44`, borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                  {lang === "ar" ? kpi.label_ar : kpi.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "2.25rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</span>
                  {kpi.unit && <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{kpi.unit}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: trendColor }}>{trendIcon}</span>
                  <span style={{ fontSize: "0.78rem", color: trendColor }}>{kpi.trend_value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
