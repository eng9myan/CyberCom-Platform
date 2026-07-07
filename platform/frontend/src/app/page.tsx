"use client";

import Link from "next/link";
import {
  Building2, FlaskConical, Scan, Pill, User, UserCog, DollarSign, Activity,
  Stethoscope, ChevronRight, Zap, Shield, Globe, BarChart3,
} from "lucide-react";

const MODULES = [
  {
    href: "/hospital",
    icon: Building2,
    title: "Hospital",
    subtitle: "مستشفى",
    desc: "Inpatient, ADT, CPOE, OR & ICU management",
    color: "text-cyan-400",
    bg: "bg-cyan-500/8 border-cyan-500/20 hover:border-cyan-400/40",
  },
  {
    href: "/clinic",
    icon: Stethoscope,
    title: "Clinic",
    subtitle: "عيادة",
    desc: "Outpatient EMR, scheduling, triage queue",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-400/40",
  },
  {
    href: "/laboratory",
    icon: FlaskConical,
    title: "Laboratory",
    subtitle: "مختبر",
    desc: "LIS, specimen tracking, LOINC results",
    color: "text-violet-400",
    bg: "bg-violet-500/8 border-violet-500/20 hover:border-violet-400/40",
  },
  {
    href: "/imaging",
    icon: Scan,
    title: "Imaging",
    subtitle: "الأشعة",
    desc: "RIS/PACS, DICOM, structured reporting",
    color: "text-sky-400",
    bg: "bg-sky-500/8 border-sky-500/20 hover:border-sky-400/40",
  },
  {
    href: "/pharmacy",
    icon: Pill,
    title: "Pharmacy",
    subtitle: "صيدلية",
    desc: "Clinical dispensing, drug interactions",
    color: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20 hover:border-amber-400/40",
  },
  {
    href: "/patient-portal",
    icon: User,
    title: "Patient Portal",
    subtitle: "بوابة المريض",
    desc: "Self-service appointments, records, payments",
    color: "text-rose-400",
    bg: "bg-rose-500/8 border-rose-500/20 hover:border-rose-400/40",
  },
  {
    href: "/provider-portal",
    icon: UserCog,
    title: "Provider Portal",
    subtitle: "بوابة الطبيب",
    desc: "Scheduling, documentation, performance",
    color: "text-indigo-400",
    bg: "bg-indigo-500/8 border-indigo-500/20 hover:border-indigo-400/40",
  },
  {
    href: "/rcm",
    icon: DollarSign,
    title: "Revenue Cycle",
    subtitle: "دورة الإيرادات",
    desc: "Insurance, claims, denial management",
    color: "text-green-400",
    bg: "bg-green-500/8 border-green-500/20 hover:border-green-400/40",
  },
  {
    href: "/population-health",
    icon: Activity,
    title: "Population Health",
    subtitle: "صحة المجتمع",
    desc: "Risk stratification, care programs, analytics",
    color: "text-pink-400",
    bg: "bg-pink-500/8 border-pink-500/20 hover:border-pink-400/40",
  },
  {
    href: "/erp",
    icon: BarChart3,
    title: "CyCom ERP",
    subtitle: "نظام تخطيط الموارد",
    desc: "Finance, HR, procurement, supply chain",
    color: "text-orange-400",
    bg: "bg-orange-500/8 border-orange-500/20 hover:border-orange-400/40",
  },
];

const TRUST = [
  { icon: Shield, label: "FHIR R4/R5 Native" },
  { icon: Globe, label: "ICD-11 · SNOMED CT" },
  { icon: Zap, label: "Arabic & English" },
];

export default function CyMedLanding() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Demo Mode Banner */}
      <div role="alert" className="flex items-center justify-center gap-2.5 border-b border-brand-400/25 bg-brand-500/10 px-6 py-2.5 text-[13px]">
        <Zap className="h-3.5 w-3.5 text-brand-400" aria-hidden />
        <span className="text-brand-200">
          <strong className="text-brand-400">Demo Mode</strong> — Live sample data. No account required. Explore all 10 modules below.
        </span>
      </div>

      {/* Hero */}
      <header className="mx-auto max-w-[900px] px-6 pb-10 pt-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/[0.06] px-3.5 py-1">
          <Stethoscope className="h-3.5 w-3.5 text-brand-400" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-400">CyMed · Clinical Platform</span>
        </div>

        <h1 className="mb-4 font-heading text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] text-ink">
          Intelligent Healthcare Platform
          <br />
          <span className="text-brand-400">منصة الرعاية الصحية الذكية</span>
        </h1>

        <p className="mx-auto mb-8 max-w-[600px] text-[17px] leading-relaxed text-ink/50">
          FHIR-native clinical suite covering every care setting.
          ICD-11, SNOMED CT, Arabic &amp; English. Select any module to explore with live demo data.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-ink/[0.04] px-3.5 py-1.5 text-xs text-ink/50">
              <Icon className="h-[13px] w-[13px] text-brand-400" aria-hidden />
              {label}
            </div>
          ))}
        </div>
      </header>

      {/* Module Grid */}
      <main className="mx-auto max-w-[1100px] px-6 pb-20">
        <h2 className="mb-7 text-center text-[13px] font-bold uppercase tracking-[0.15em] text-ink/40">
          9 Clinical Modules — Click to Explore
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4" role="list" aria-label="CyMed modules">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                role="listitem"
                className="cy-card flex items-start gap-4 p-5 no-underline"
              >
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-ink/[0.08] bg-ink/[0.04]" aria-hidden>
                  <Icon className={`h-5 w-5 ${mod.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold">{mod.title}</span>
                    <span className="text-[13px] text-ink/40">{mod.subtitle}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink/40">{mod.desc}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" aria-hidden />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
