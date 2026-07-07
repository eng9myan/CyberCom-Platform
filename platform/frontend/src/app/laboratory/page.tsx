"use client";

import { usePreferences } from "@/contexts/preferences";

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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "stat" | "urgent" | "routine">("all");

  const filtered = priorityFilter === "all" ? ORDERS : ORDERS.filter(o => o.priority === priorityFilter);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">
            {lang === "en" ? "CyMed Laboratory" : "مختبر سايمد"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Laboratory Information System" : "نظام معلومات المختبر"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {METRICS.critical_pending > 0 && (
            <div className="rounded-lg border-2 border-red-500 bg-red-500/10 px-3 py-1.5 text-sm font-bold text-red-400">
              ⚠ {METRICS.critical_pending} {lang === "en" ? "Critical Pending" : "حرجة معلقة"}
            </div>
          )}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/laboratory/orders", label: lang === "en" ? "Orders" : "الطلبات" },
          { href: "/laboratory/specimens", label: lang === "en" ? "Specimens" : "العينات" },
          { href: "/laboratory/worklists", label: lang === "en" ? "Worklists" : "قوائم العمل" },
          { href: "/laboratory/results", label: lang === "en" ? "Results" : "النتائج" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-lg border border-ink/10 px-4 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mb-6 grid grid-cols-4 gap-4 sm:grid-cols-8">
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
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{lang === "en" ? "Active Lab Orders" : "طلبات المختبر النشطة"}</h2>
        <div className="flex gap-1">
          {(["all", "stat", "urgent", "routine"] as const).map(f => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{
                background: priorityFilter === f ? priorityColor(f === "all" ? "routine" : f) : "var(--color-surface)",
                color: priorityFilter === f ? "#fff" : "var(--color-text)",
              }}
            >
              {f === "all" ? (lang === "en" ? "All" : "الكل") : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="cy-card overflow-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {["Order #", "Patient", "Test/Panel", "Priority", "Status", "TAT Progress", "Actions"].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-ink/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} className="border-b border-ink/5">
                <td className="px-4 py-3.5 font-mono text-xs text-brand-400">{order.order_number}</td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-medium">{lang === "ar" ? order.patient_name_ar : order.patient_name}</div>
                  <div className="text-xs text-ink/50">{order.mrn}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm">{order.panel_name}</div>
                  <div className="text-xs text-ink/50">{order.ordered_by}</div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: priorityColor(order.priority) + "22", color: priorityColor(order.priority), border: `1px solid ${priorityColor(order.priority)}` }}>
                    {order.priority.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: statusColor(order.status) + "22", color: statusColor(order.status) }}>
                    {order.status}
                  </span>
                </td>
                <td className="min-w-[140px] px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-ink/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (order.tat_elapsed_hours / order.tat_target_hours) * 100)}%`, background: tatColor(order.tat_elapsed_hours, order.tat_target_hours) }} />
                    </div>
                    <span className="min-w-[50px] text-xs" style={{ color: tatColor(order.tat_elapsed_hours, order.tat_target_hours) }}>
                      {order.tat_elapsed_hours}h/{order.tat_target_hours}h
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button className="cy-btn cy-btn-primary !min-h-0 !py-1 !px-2.5 text-xs">
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
