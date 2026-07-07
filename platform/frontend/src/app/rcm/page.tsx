"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface RCMDashboardRaw {
  days_in_ar?: number;
  total_ar?: number;
  collection_rate_pct_pct?: number;
  denial_rate_pct?: number;
  net_collection_rate_pct_pct?: number;
  gross_charges?: number;
  net_revenue?: number;
  adjustments?: number;
  cash_collected?: number;
  outstanding?: number;
  ar_by_age?: ARByAge[];
}

interface RCMMetrics {
  days_in_ar: number;
  total_ar: number;
  collection_rate_pct: number;
  denial_rate_pct: number;
  net_collection_rate_pct: number;
  gross_charges: number;
  net_revenue: number;
  adjustments: number;
  cash_collected: number;
  outstanding: number;
}

interface ARByAge {
  bucket: string;
  amount: number;
}

const METRICS: RCMMetrics = {
  days_in_ar: 42.3,
  total_ar: 2400000.00,
  collection_rate_pct: 94.2,
  denial_rate_pct: 8.1,
  net_collection_rate_pct: 91.8,
  gross_charges: 1500000.00,
  net_revenue: 1380000.00,
  adjustments: 120000.00,
  cash_collected: 847000.00,
  outstanding: 653000.00,
};

const AGING_BUCKETS: ARByAge[] = [
  { bucket: "0-30 days", amount: 1200000.00 },
  { bucket: "31-60 days", amount: 600000.00 },
  { bucket: "61-90 days", amount: 400000.00 },
  { bucket: "91-120 days", amount: 150000.00 },
  { bucket: "120+ days", amount: 50000.00 },
];

export default function RCMDashboard() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [metrics, setMetrics] = useState<RCMMetrics>(METRICS);
  const [aging, setAging] = useState<ARByAge[]>(AGING_BUCKETS);
  useEffect(() => {
    async function fetchRcmData() {
      try {
        const dashboard = await apiFetch<RCMDashboardRaw>("/api/v1/rcm/analytics/dashboard/");
        if (dashboard) {
          setMetrics({
            days_in_ar: dashboard.days_in_ar ?? 42.3,
            total_ar: dashboard.total_ar ?? 2400000.00,
            collection_rate_pct: dashboard.collection_rate_pct_pct ?? 94.2,
            denial_rate_pct: dashboard.denial_rate_pct ?? 8.1,
            net_collection_rate_pct: dashboard.net_collection_rate_pct_pct ?? 91.8,
            gross_charges: dashboard.gross_charges ?? 1500000.00,
            net_revenue: dashboard.net_revenue ?? 1380000.00,
            adjustments: dashboard.adjustments ?? 120000.00,
            cash_collected: dashboard.cash_collected ?? 847000.00,
            outstanding: dashboard.outstanding ?? 653000.00,
          });
          if (dashboard.ar_by_age) {
            setAging(dashboard.ar_by_age);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live RCM data, using mock data:", err);
      }
    }
    void fetchRcmData();
  }, []);

  const totalCollected = metrics.cash_collected;
  const targetColor = metrics.denial_rate_pct > 10 ? "#ef4444" : metrics.denial_rate_pct > 5 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ direction: lang === "ar" ? "rtl" : "ltr" }} className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "CyMed Revenue Cycle (RCM)" : "دورة الإيرادات سايمد (RCM)"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Financial Performance & Accounts Receivable" : "الأداء المالي وحسابات المدينين"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Days in A/R" : "أيام حسابات المدينين"}</div>
          <div className="mt-2 text-2xl font-bold">{metrics.days_in_ar} {lang === "en" ? "days" : "يوم"}</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Clean Claim Rate" : "معدل المطالبات النظيفة"}</div>
          <div className="mt-2 text-2xl font-bold">{metrics.collection_rate_pct}%</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Claim Denial Rate" : "معدل رفض المطالبات"}</div>
          <div className="mt-2 text-2xl font-bold" style={{ color: targetColor }}>{metrics.denial_rate_pct}%</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Net Collection Rate" : "صافي معدل التحصيل"}</div>
          <div className="mt-2 text-2xl font-bold">{metrics.net_collection_rate_pct}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <div className="cy-card p-6">
          <h2 className="mb-5 text-lg font-bold">
            {lang === "en" ? "Financial Rollup Summary" : "ملخص تسوية الإيرادات والتحصيل"}
          </h2>
          <div className="grid gap-3">
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/50">{lang === "en" ? "Gross Charges" : "إجمالي الرسوم الباهظة"}</span>
              <span className="font-semibold">SAR {metrics.gross_charges.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/50">{lang === "en" ? "Net Expected Revenue" : "صافي الإيرادات المتوقعة"}</span>
              <span className="font-semibold">SAR {metrics.net_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/50">{lang === "en" ? "Contractual Adjustments" : "التسويات التعاقدية"}</span>
              <span className="font-semibold">SAR {metrics.adjustments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/50">{lang === "en" ? "Cash Collected" : "النقد المحصل فعلياً"}</span>
              <span className="font-semibold text-emerald-400">SAR {totalCollected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-3">
              <span className="text-sm text-ink/50">{lang === "en" ? "Outstanding Balance" : "الرصيد المتبقي المستحق"}</span>
              <span className="font-semibold text-red-400">SAR {metrics.outstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="cy-card p-6">
          <h2 className="mb-5 text-lg font-bold">
            {lang === "en" ? "A/R Aging Buckets" : "أعمار الديون المستحقة"}
          </h2>
          <div className="grid gap-4">
            {aging.map((item) => (
              <div key={item.bucket} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{item.bucket}</span>
                  <span className="font-semibold">SAR {item.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-ink/5">
                  <div
                    className="h-full bg-brand-400"
                    style={{ width: `${Math.min(100, (item.amount / metrics.total_ar) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
