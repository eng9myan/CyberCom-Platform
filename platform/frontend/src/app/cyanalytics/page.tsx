"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bed,
  Building2,
  ChevronRight,
  ClipboardList,
  Coins,
  FlaskConical,
  HeartPulse,
  Lock,
  Pill,
  Radar,
  Scan,
  Send,
  Siren,
  Sparkles,
  Stethoscope,
  Users,
  Warehouse,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { currentNode, useCyAnalyticsStore } from "@/lib/cyanalytics/store";
import { useHospitalKpis } from "@/lib/cyanalytics/useKpiEngine";
import type { DepartmentTile } from "@/lib/cyanalytics/types";

const TILES: DepartmentTile[] = [
  { id: "command-center", name: "Enterprise Command Center", href: "/cyanalytics", icon: "Building2", status: "live" },
  { id: "multi-hospital", name: "Multi-Hospital Dashboard", href: "/cyanalytics/multi-hospital", icon: "Radar", status: "live" },
  { id: "hospital-ceo", name: "Hospital CEO Dashboard", href: "/hospital", icon: "Building2", status: "live" },
  { id: "medical-director", name: "Medical Director", href: "#", icon: "Stethoscope", status: "coming_soon" },
  { id: "operations", name: "Operations", href: "#", icon: "ClipboardList", status: "coming_soon" },
  { id: "emergency", name: "Emergency", href: "/hospital/emergency", icon: "Siren", status: "live" },
  { id: "icu", name: "ICU", href: "/hospital/icu", icon: "HeartPulse", status: "live" },
  { id: "nursing", name: "Nursing", href: "#", icon: "Users", status: "coming_soon" },
  { id: "doctor", name: "Doctor Workspace", href: "/hospital/doctor-workspace", icon: "Stethoscope", status: "live" },
  { id: "reception", name: "Reception", href: "#", icon: "ClipboardList", status: "coming_soon" },
  { id: "laboratory", name: "Laboratory", href: "/laboratory", icon: "FlaskConical", status: "live" },
  { id: "imaging", name: "Imaging", href: "/imaging", icon: "Scan", status: "live" },
  { id: "pharmacy", name: "Pharmacy", href: "/pharmacy", icon: "Pill", status: "live" },
  { id: "hr", name: "HR", href: "/hospital/hr", icon: "Users", status: "live" },
  { id: "finance", name: "Finance", href: "/hospital/billing", icon: "Coins", status: "live" },
  { id: "inventory", name: "Inventory", href: "/hospital/inventory", icon: "Warehouse", status: "live" },
  { id: "biomed", name: "BioMed Engineering", href: "#", icon: "Activity", status: "coming_soon" },
  { id: "infection-control", name: "Infection Control", href: "#", icon: "AlertTriangle", status: "coming_soon" },
  { id: "quality", name: "Quality", href: "#", icon: "ClipboardList", status: "coming_soon" },
  { id: "research", name: "Research", href: "#", icon: "FlaskConical", status: "coming_soon" },
];

const ICONS: Record<string, typeof Building2> = {
  Building2, Radar, Stethoscope, ClipboardList, Siren, HeartPulse, Users,
  FlaskConical, Scan, Pill, Coins, Warehouse, Activity, AlertTriangle,
};

function KpiTile({
  label, value, unit, tone = "default",
}: { label: string; value: string | number; unit?: string; tone?: "default" | "warning" | "critical" }) {
  const toneClass =
    tone === "critical" ? "text-red-400" : tone === "warning" ? "text-amber-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md shadow-lg shadow-black/20">
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-white/40">{unit}</span>}
      </p>
    </div>
  );
}

function DepartmentCard({ tile }: { tile: DepartmentTile }) {
  const Icon = ICONS[tile.icon] ?? Building2;
  const body = (
    <div
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-md transition-all ${
        tile.status === "live"
          ? "border-white/10 bg-white/[0.04] hover:border-brand-400/50 hover:bg-white/[0.07]"
          : "border-white/5 bg-white/[0.02] opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <Icon size={20} />
        </div>
        {tile.status === "coming_soon" && (
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            <Lock size={10} /> Coming soon
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-white/90">{tile.name}</p>
    </div>
  );

  if (tile.status !== "live") return body;
  return <Link href={tile.href}>{body}</Link>;
}

export default function CyAnalyticsExecutiveWall() {
  const { session } = useAuth();
  const drillPath = useCyAnalyticsStore((s) => s.drillPath);
  const node = useMemo(() => currentNode(drillPath), [drillPath]);
  const kpis = useHospitalKpis("hospital");

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  async function askAssistant() {
    if (!session || !question.trim()) return;
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    try {
      const result = await apiFetch<{ answer: string }>("/api/v1/hospital/command-center/ai/ask/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ question }),
      });
      setAnswer(result.answer);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setAskError(detail || (err instanceof Error ? err.message : "Assistant request failed."));
    } finally {
      setAsking(false);
    }
  }

  const census = kpis.data?.census;
  const modules = kpis.data?.modules;
  const occupancy = census?.capacity_indicators.bed_occupancy_percentage;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
        {drillPath.map((n, i) => (
          <div key={`${n.level}-${n.id}`} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} />}
            <span className={i === drillPath.length - 1 ? "font-semibold text-white" : ""}>
              {n.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CyAnalytics Executive Wall</h1>
          <p className="mt-1 text-sm text-white/50">
            {kpis.lastUpdated
              ? `Live · updated ${new Date(kpis.lastUpdated).toLocaleTimeString()}`
              : kpis.loading
                ? "Connecting to real-time feed…"
                : "Awaiting data"}
          </p>
        </div>
        <Sparkles className="text-brand-400" size={28} />
      </div>

      {/* KPI strip -- real data only; honest empty/error states, never invented numbers */}
      {kpis.error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {kpis.error}
        </div>
      )}
      {!kpis.available && kpis.unavailableReason && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {kpis.unavailableReason}
        </div>
      )}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile
          label="Active Admissions"
          value={census?.operational_census.active_admissions ?? "—"}
        />
        <KpiTile
          label="Bed Occupancy"
          value={occupancy != null ? occupancy.toFixed(0) : "—"}
          unit="%"
          tone={occupancy != null && occupancy >= 90 ? "critical" : occupancy != null && occupancy >= 75 ? "warning" : "default"}
        />
        <KpiTile
          label="ICU Occupancy"
          value={census?.operational_census.icu_occupancy ?? "—"}
        />
        <KpiTile
          label="ER Waiting"
          value={census?.operational_census.emergency_waiting ?? "—"}
          tone={
            census && census.operational_census.emergency_waiting > 10 ? "warning" : "default"
          }
        />
        <KpiTile
          label="Scheduled Procedures"
          value={census?.operational_census.scheduled_procedures_today ?? "—"}
        />
        <KpiTile
          label="Invoices Outstanding"
          value={modules?.invoices_outstanding ?? "—"}
        />
      </div>

      {/* Department grid -- drill-down entry points */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
        Command Center Modules
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {TILES.map((tile) => (
          <DepartmentCard key={tile.id} tile={tile} />
        ))}
      </div>

      {/* CyAI panel -- present on every dashboard per spec */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <Bed size={16} className="text-brand-300" />
          <p className="text-sm font-semibold">CyAI — Ask about this hospital</p>
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAssistant()}
            placeholder="e.g. Why did ER waiting time increase today?"
            className="flex-1 rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none"
          />
          <button
            onClick={askAssistant}
            disabled={asking || !question.trim()}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40"
          >
            <Send size={14} /> Ask
          </button>
        </div>
        {askError && <p className="mt-2 text-sm text-red-300">{askError}</p>}
        {answer && (
          <p className="mt-3 rounded-lg bg-black/20 p-3 text-sm text-white/80">{answer}</p>
        )}
      </div>
    </div>
  );
}
