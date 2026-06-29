"use client";

import Link from "next/link";
import {
  Building2, FlaskConical, Scan, Pill, User, UserCog, DollarSign, Activity,
  Stethoscope, ChevronRight, Zap, Shield, Globe,
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
];

const TRUST = [
  { icon: Shield, label: "FHIR R4/R5 Native" },
  { icon: Globe, label: "ICD-11 · SNOMED CT" },
  { icon: Zap, label: "Arabic & English" },
];

export default function CyMedLanding() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Demo Mode Banner */}
      <div
        role="alert"
        style={{
          background: "rgba(8, 145, 178, 0.10)",
          borderBottom: "1px solid rgba(8, 145, 178, 0.25)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontSize: "13px",
        }}
      >
        <Zap style={{ width: 14, height: 14, color: "#22D3EE" }} aria-hidden />
        <span style={{ color: "#A5F3FC" }}>
          <strong style={{ color: "#22D3EE" }}>Demo Mode</strong> — Live sample data. No account required. Explore all 9 CyMed modules below.
        </span>
      </div>

      {/* Hero */}
      <header style={{ padding: "60px 24px 40px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 999, border: "1px solid rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.06)", marginBottom: 20 }}>
          <Stethoscope style={{ width: 14, height: 14, color: "#22D3EE" }} aria-hidden />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#22D3EE", letterSpacing: "0.15em", textTransform: "uppercase" }}>CyMed · Clinical Platform</span>
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: 16, color: "#ffffff" }}>
          Intelligent Healthcare Platform
          <br />
          <span style={{ color: "#22D3EE" }}>منصة الرعاية الصحية الذكية</span>
        </h1>

        <p style={{ fontSize: 17, color: "var(--color-muted, #94A3B8)", maxWidth: 600, margin: "0 auto 32px", lineHeight: 1.6 }}>
          FHIR-native clinical suite covering every care setting.
          ICD-11, SNOMED CT, Arabic &amp; English. Select any module to explore with live demo data.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {TRUST.map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", fontSize: 12, color: "#94A3B8" }}
            >
              <Icon style={{ width: 13, height: 13, color: "#22D3EE" }} aria-hidden />
              {label}
            </div>
          ))}
        </div>
      </header>

      {/* Module Grid */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 28 }}>
          9 Clinical Modules — Click to Explore
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
          role="list"
          aria-label="CyMed modules"
        >
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                role="listitem"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: 20,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(34,211,238,0.25)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <Icon style={{ width: 20, height: 20, color: "#22D3EE" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#F1F5F9" }}>{mod.title}</span>
                    <span style={{ fontSize: 13, color: "#64748B" }}>{mod.subtitle}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{mod.desc}</p>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: "#475569", flexShrink: 0, marginTop: 2 }} aria-hidden />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
