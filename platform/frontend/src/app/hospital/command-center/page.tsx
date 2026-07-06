"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface CapacityRule { id: string; rule_name: string; metric_source: string; threshold_value: number; action_plan_name: string; }
interface CapacityThreshold { id: string; rule: string; current_value: number; status_level: "normal" | "warning" | "critical"; updated_at: string; }
interface SurgePlan { id: string; name: string; trigger_condition: string; allocated_beds_count: number; is_active: boolean; }
interface OverflowUnit { id: string; name: string; temporary_capacity: number; current_occupancy: number; is_open: boolean; }
interface Paginated<T> { count: number; results: T[]; }

interface CommandCenterSnapshot {
  operational_census: {
    active_admissions: number;
    current_occupied_beds: number;
    total_beds: number;
    emergency_waiting: number;
    icu_occupancy: number;
    scheduled_procedures_today: number;
  };
  capacity_indicators: { bed_occupancy_percentage: number };
}

interface AskResult { answer: string; }

const STATUS_COLOR: Record<string, string> = { normal: "#22c55e", warning: "#f59e0b", critical: "#ef4444" };

export default function CommandCenterPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [snapshot, setSnapshot] = useState<CommandCenterSnapshot | null>(null);
  const [rules, setRules] = useState<CapacityRule[]>([]);
  const [thresholds, setThresholds] = useState<CapacityThreshold[]>([]);
  const [surgePlans, setSurgePlans] = useState<SurgePlan[]>([]);
  const [overflowUnits, setOverflowUnits] = useState<OverflowUnit[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"thresholds" | "surge" | "ai">("thresholds");
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [snap, rulePage, thresholdPage, surgePage, overflowPage] = await Promise.all([
        apiFetch<CommandCenterSnapshot>("/api/v1/hospital/command-center/metrics/", opts),
        apiFetch<Paginated<CapacityRule>>("/api/v1/hospital/capacity/rules/", opts),
        apiFetch<Paginated<CapacityThreshold>>("/api/v1/hospital/capacity/thresholds/", opts),
        apiFetch<Paginated<SurgePlan>>("/api/v1/hospital/capacity/surge-plans/", opts),
        apiFetch<Paginated<OverflowUnit>>("/api/v1/hospital/capacity/overflow-units/", opts),
      ]);
      setSnapshot(snap);
      setRules(rulePage.results);
      setThresholds(thresholdPage.results);
      setSurgePlans(surgePage.results);
      setOverflowUnits(overflowPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load command center data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function askAssistant() {
    if (!session || !question.trim()) return;
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    try {
      const result = await apiFetch<AskResult>("/api/v1/hospital/command-center/ai/ask/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ question }),
      });
      setAnswer(result.answer);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setAskError(detail || (err instanceof Error ? err.message : "Failed to reach the AI assistant."));
    } finally {
      setAsking(false);
    }
  }

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load command center data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (snapshot === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live command center data...</div>;
  }

  const ruleFor = (id: string) => rules.find(r => r.id === id);
  const criticalCount = thresholds.filter(t => t.status_level === "critical").length;
  const warningCount = thresholds.filter(t => t.status_level === "warning").length;
  const activeSurgePlans = surgePlans.filter(p => p.is_active).length;
  const openOverflowUnits = overflowUnits.filter(u => u.is_open).length;
  const census = snapshot.operational_census;

  return (
    <div dir={dir} style={{ maxWidth: "1300px", margin: "0 auto" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><LayoutDashboard size={22} /> {lang === "en" ? "Clinical Command Center" : "مركز القيادة السريرية"}</h1>
          <p className="mt-1 text-sm text-white/50">{lang === "en" ? "Real-time capacity thresholds, surge status, and AI assistant" : "عتبات الطاقة الفورية وحالة التصعيد والمساعد الذكي"}</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="rounded-lg border-2 border-red-500 bg-red-950/40 px-3.5 py-1.5">
              <span className="text-xs font-bold text-red-400">{criticalCount} {lang === "en" ? "CRITICAL" : "حرجة"}</span>
            </div>
          )}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium hover:bg-white/5">
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: lang === "en" ? "Bed Occupancy" : "إشغال الأسرة", value: `${snapshot.capacity_indicators.bed_occupancy_percentage}%`, color: "#f59e0b" },
          { label: lang === "en" ? "Critical Thresholds" : "عتبات حرجة", value: criticalCount, color: "#ef4444" },
          { label: lang === "en" ? "Warning Thresholds" : "عتبات تحذير", value: warningCount, color: "#f59e0b" },
          { label: lang === "en" ? "Active Surge Plans" : "خطط تصعيد نشطة", value: activeSurgePlans, color: "#8b5cf6" },
        ].map(card => (
          <div key={card.label} className="rounded-xl border p-4 text-center" style={{ background: "var(--color-surface)", borderColor: `${card.color}44` }}>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="mt-1 text-xs text-white/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2 border-b border-white/10">
        {(["thresholds", "surge", "ai"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-0.5 border-b-2 px-5 py-2.5 text-sm font-semibold ${activeTab === tab ? "border-brand-400 text-brand-300" : "border-transparent text-white/50"}`}
          >
            {tab === "thresholds" ? (lang === "en" ? "Capacity Thresholds" : "عتبات الطاقة") :
             tab === "surge" ? (lang === "en" ? "Surge & Overflow" : "التصعيد والفائض") :
             (lang === "en" ? "AI Assistant" : "المساعد الذكي")}
          </button>
        ))}
      </div>

      {activeTab === "thresholds" && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {[lang === "en" ? "Rule" : "القاعدة", lang === "en" ? "Metric Source" : "مصدر المقياس", lang === "en" ? "Current" : "الحالي", lang === "en" ? "Threshold" : "العتبة", lang === "en" ? "Status" : "الحالة", lang === "en" ? "Action Plan" : "خطة الإجراء"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thresholds.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-white/50">No capacity rules configured for this tenant yet.</td></tr>
                )}
                {thresholds.map(t => {
                  const rule = ruleFor(t.rule);
                  return (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium">{rule?.rule_name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{rule?.metric_source ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{t.current_value}</td>
                      <td className="px-4 py-3 text-white/60">{rule?.threshold_value ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase" style={{ background: `${STATUS_COLOR[t.status_level]}22`, color: STATUS_COLOR[t.status_level] }}>{t.status_level}</span>
                      </td>
                      <td className="px-4 py-3 text-white/60">{rule?.action_plan_name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "surge" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white/50">{lang === "en" ? "Surge Plans" : "خطط التصعيد"}</h3>
            <div className="space-y-3">
              {surgePlans.length === 0 && <p className="text-sm text-white/50">No surge plans configured.</p>}
              {surgePlans.map(p => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-surface-raised p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.is_active ? "bg-red-500/15 text-red-400" : "bg-white/10 text-white/50"}`}>
                      {p.is_active ? (lang === "en" ? "ACTIVE" : "نشط") : (lang === "en" ? "Inactive" : "غير نشط")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{p.trigger_condition}</p>
                  <p className="mt-1 text-xs text-white/40">{p.allocated_beds_count} {lang === "en" ? "beds allocated" : "سرير مخصص"}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white/50">{lang === "en" ? "Overflow Units" : "وحدات الفائض"} ({openOverflowUnits} {lang === "en" ? "open" : "مفتوحة"})</h3>
            <div className="space-y-3">
              {overflowUnits.length === 0 && <p className="text-sm text-white/50">No overflow units configured.</p>}
              {overflowUnits.map(u => (
                <div key={u.id} className="rounded-xl border border-white/10 bg-surface-raised p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{u.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.is_open ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/50"}`}>
                      {u.is_open ? (lang === "en" ? "OPEN" : "مفتوح") : (lang === "en" ? "Closed" : "مغلق")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{u.current_occupancy} / {u.temporary_capacity} {lang === "en" ? "occupied" : "مشغول"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-surface-raised p-4">
            <h3 className="mb-2 text-sm font-semibold text-white/50">{lang === "en" ? "Live Operational Census" : "الإحصاء التشغيلي المباشر"}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Active Admissions", value: census.active_admissions },
                { label: "Occupied / Total Beds", value: `${census.current_occupied_beds}/${census.total_beds}` },
                { label: "ED Waiting", value: census.emergency_waiting },
                { label: "ICU Occupancy", value: census.icu_occupancy },
                { label: "OR Scheduled Today", value: census.scheduled_procedures_today },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-lg font-bold text-brand-300">{m.value}</div>
                  <div className="text-xs text-white/50">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="rounded-xl border border-white/10 bg-surface-raised p-5">
          <p className="mb-4 text-sm text-white/50">
            {lang === "en"
              ? "Ask about admissions, beds, staffing, or infection control — grounded in this tenant's real operational data. Advisory only."
              : "اسأل عن القبول أو الأسرة أو الكوادر أو مكافحة العدوى — بناءً على بيانات هذا المستأجر الحقيقية. للاستشارة فقط."}
          </p>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askAssistant()}
              placeholder={lang === "en" ? "e.g. What is our current bed capacity?" : "مثال: ما هي طاقة الأسرة الحالية؟"}
              className="flex-1 rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <button onClick={askAssistant} disabled={asking || !question.trim()} className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40">
              <Send size={16} /> {asking ? "..." : lang === "en" ? "Ask" : "اسأل"}
            </button>
          </div>
          {askError && <p className="mt-3 text-sm text-red-400">{askError}</p>}
          {answer && (
            <div className="mt-4 rounded-lg bg-white/5 p-4 text-sm whitespace-pre-wrap">{answer}</div>
          )}
        </div>
      )}
    </div>
  );
}
