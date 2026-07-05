"use client";

import { useState, useEffect, useCallback } from "react";
import { Siren } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type ESILevel = 1 | 2 | 3 | 4 | 5;
type VisitStatus = "triage" | "fast_track" | "resuscitation" | "observation" | "admitted" | "discharged";

interface EmergencyVisit {
  id: string;
  patient: string;
  arrival_time: string;
  arrival_method: string;
  presenting_complaint: string;
  status: VisitStatus;
}
interface EmergencyTriage { id: string; visit: string; esi_level: ESILevel; chief_complaint: string; logged_at: string; }
interface EmergencyObservation { id: string; visit: string; observed_at: string; systolic_bp: number; diastolic_bp: number; heart_rate: number; resp_rate: number; temp_c: string; o2_sat: number; }
interface EmergencyTracking { id: string; visit: string; location_label: string; left_at: string | null; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; dob: string; gender: string; }
interface Paginated<T> { count: number; results: T[]; }

const ESI_COLORS: Record<ESILevel, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "#1f0808", border: "#dc2626", text: "#fca5a5", label: "ESI-1 Resuscitation" },
  2: { bg: "#1f1008", border: "#f97316", text: "#fdba74", label: "ESI-2 Emergent" },
  3: { bg: "#1c1508", border: "#eab308", text: "#fde047", label: "ESI-3 Urgent" },
  4: { bg: "#082010", border: "#22c55e", text: "#86efac", label: "ESI-4 Less Urgent" },
  5: { bg: "#0a0a1a", border: "#3b82f6", text: "#93c5fd", label: "ESI-5 Non-Urgent" },
};

const STATUS_LABELS: Record<VisitStatus, { en: string; ar: string; color: string }> = {
  triage: { en: "Triage", ar: "الفرز", color: "#f59e0b" },
  fast_track: { en: "Fast Track", ar: "المسار السريع", color: "#3b82f6" },
  resuscitation: { en: "Resuscitation", ar: "إنعاش", color: "#ef4444" },
  observation: { en: "Observation", ar: "ملاحظة", color: "#22D3EE" },
  admitted: { en: "Admitted", ar: "مقبول", color: "#8b5cf6" },
  discharged: { en: "Discharged", ar: "خروج", color: "#22c55e" },
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function EmergencyPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [visits, setVisits] = useState<EmergencyVisit[] | null>(null);
  const [triages, setTriages] = useState<EmergencyTriage[]>([]);
  const [observations, setObservations] = useState<EmergencyObservation[]>([]);
  const [tracking, setTracking] = useState<EmergencyTracking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterESI, setFilterESI] = useState<ESILevel | "all">("all");
  const [filterStatus, setFilterStatus] = useState<VisitStatus | "all">("all");
  const [selectedVisit, setSelectedVisit] = useState<EmergencyVisit | null>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [visitPage, triagePage, obsPage, trackingPage, patientPage] = await Promise.all([
        apiFetch<Paginated<EmergencyVisit>>("/api/v1/hospital/emergency/visits/", opts),
        apiFetch<Paginated<EmergencyTriage>>("/api/v1/hospital/emergency/triage/", opts),
        apiFetch<Paginated<EmergencyObservation>>("/api/v1/hospital/emergency/observations/", opts),
        apiFetch<Paginated<EmergencyTracking>>("/api/v1/hospital/emergency/tracking/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
      ]);
      setVisits(visitPage.results);
      setTriages(triagePage.results);
      setObservations(obsPage.results);
      setTracking(trackingPage.results);
      setPatients(patientPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load emergency department data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load emergency department data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (visits === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live ED data...</div>;
  }

  const activeVisits = visits.filter(v => v.status !== "discharged");
  const patientFor = (id: string) => patients.find(p => p.id === id);
  const triageFor = (visitId: string) => triages.find(t => t.visit === visitId);
  const latestObsFor = (visitId: string) => observations.filter(o => o.visit === visitId).sort((a, b) => b.observed_at.localeCompare(a.observed_at))[0];
  const locationFor = (visitId: string) => tracking.filter(t => t.visit === visitId && !t.left_at)[0]?.location_label;
  const waitMinutes = (arrivalTime: string) => Math.round((Date.now() - new Date(arrivalTime).getTime()) / (1000 * 60));

  const esiCounts: Record<ESILevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const v of activeVisits) {
    const esi = triageFor(v.id)?.esi_level;
    if (esi) esiCounts[esi]++;
  }
  const avgWait = activeVisits.length ? Math.round(activeVisits.reduce((s, v) => s + waitMinutes(v.arrival_time), 0) / activeVisits.length) : 0;

  let filtered = activeVisits;
  if (filterESI !== "all") filtered = filtered.filter(v => triageFor(v.id)?.esi_level === filterESI);
  if (filterStatus !== "all") filtered = filtered.filter(v => v.status === filterStatus);

  return (
    <div dir={dir} style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Siren size={22} /> {lang === "en" ? "Emergency Department" : "قسم الطوارئ"}</h1>
          <p className="mt-1 text-sm text-white/50">{lang === "en" ? "Live patient census, triage, and disposition tracking" : "جرد المرضى الفوري والفرز وتتبع الوجهة"}</p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium hover:bg-white/5">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: lang === "en" ? "Active Patients" : "مرضى نشطون", value: activeVisits.length, color: "#22D3EE" },
          { label: lang === "en" ? "Triage" : "الفرز", value: activeVisits.filter(v => v.status === "triage").length, color: "#f59e0b" },
          { label: lang === "en" ? "Resuscitation" : "إنعاش", value: activeVisits.filter(v => v.status === "resuscitation").length, color: "#ef4444" },
          { label: lang === "en" ? "Avg Wait (min)" : "متوسط الانتظار", value: avgWait, color: "#6366f1" },
        ].map(card => (
          <div key={card.label} className="rounded-xl border p-4 text-center" style={{ background: "var(--color-surface)", borderColor: `${card.color}44` }}>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="mt-1 text-xs text-white/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
        <h3 className="mb-3 text-sm font-semibold text-white/50">{lang === "en" ? "ESI Triage Level Distribution" : "توزيع مستويات الفرز"}</h3>
        <div className="flex flex-wrap gap-3">
          {([1, 2, 3, 4, 5] as ESILevel[]).map(level => {
            const esi = ESI_COLORS[level];
            return (
              <div key={level} className="min-w-[110px] rounded-lg border-2 p-3 text-center" style={{ background: esi.bg, borderColor: esi.border }}>
                <div className="text-xl font-bold" style={{ color: esi.text }}>{esiCounts[level]}</div>
                <div className="mt-0.5 text-xs font-semibold opacity-85" style={{ color: esi.text }}>{lang === "en" ? esi.label : `مستوى ${level}`}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-xs font-semibold text-white/50">ESI:</span>
          {(["all", 1, 2, 3, 4, 5] as (ESILevel | "all")[]).map(e => (
            <button key={e} onClick={() => setFilterESI(e)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filterESI === e ? "border-2 border-brand-400 bg-brand-500/15 text-brand-200" : "border border-white/10 bg-surface-overlay text-white/50"}`}>
              {e === "all" ? (lang === "en" ? "All" : "الكل") : `ESI ${e}`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-xs font-semibold text-white/50">{lang === "en" ? "Status:" : "الحالة:"}</span>
          {(["all", "triage", "resuscitation", "observation", "admitted"] as (VisitStatus | "all")[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filterStatus === s ? "border-2 border-brand-400 bg-brand-500/15 text-brand-200" : "border border-white/10 bg-surface-overlay text-white/50"}`}>
              {s === "all" ? (lang === "en" ? "All" : "الكل") : STATUS_LABELS[s].en}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["ESI", lang === "en" ? "Patient" : "المريض", lang === "en" ? "Age/Sex" : "العمر/الجنس", lang === "en" ? "Complaint" : "الشكوى", lang === "en" ? "Wait" : "الانتظار", lang === "en" ? "Status" : "الحالة", lang === "en" ? "Location" : "الموقع", lang === "en" ? "Vitals" : "العلامات"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-white/50">No active ED patients for this filter.</td></tr>
              )}
              {filtered.map(v => {
                const patient = patientFor(v.patient);
                const triage = triageFor(v.id);
                const obs = latestObsFor(v.id);
                const stl = STATUS_LABELS[v.status];
                const wait = waitMinutes(v.arrival_time);
                return (
                  <tr key={v.id} onClick={() => setSelectedVisit(selectedVisit?.id === v.id ? null : v)} className={`cursor-pointer border-b border-white/5 ${selectedVisit?.id === v.id ? "bg-brand-500/10" : ""}`}>
                    <td className="px-4 py-3">
                      {triage ? (
                        <div className="inline-block min-w-[44px] rounded-md border-2 px-2 py-0.5 text-center" style={{ background: ESI_COLORS[triage.esi_level].bg, borderColor: ESI_COLORS[triage.esi_level].border }}>
                          <span className="text-xs font-bold" style={{ color: ESI_COLORS[triage.esi_level].text }}>ESI {triage.esi_level}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{patient ? `${patient.first_name} ${patient.last_name}` : "Unknown"}</div>
                      <div className="text-xs text-white/50">{patient?.mrn}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/60">{patient ? `${calcAge(patient.dob)}y ${patient.gender[0]?.toUpperCase()}` : "—"}</td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-white/60">{v.presenting_complaint}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: wait > 120 ? "#ef4444" : wait > 60 ? "#f59e0b" : "#22c55e" }}>{wait}m</td>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${stl.color}22`, color: stl.color }}>{lang === "en" ? stl.en : stl.ar}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-300">{locationFor(v.id) ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {obs ? (
                        <div>
                          <div>BP: {obs.systolic_bp}/{obs.diastolic_bp}</div>
                          <div>HR: {obs.heart_rate}</div>
                          <div style={{ color: obs.o2_sat < 94 ? "#ef4444" : undefined }}>SpO2: {obs.o2_sat}%</div>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVisit && (() => {
        const patient = patientFor(selectedVisit.patient);
        const triage = triageFor(selectedVisit.id);
        const obs = latestObsFor(selectedVisit.id);
        return (
          <div className="mt-6 rounded-xl border-2 bg-surface-raised p-6" style={{ borderColor: triage ? ESI_COLORS[triage.esi_level].border : "var(--color-border)" }}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{patient ? `${patient.first_name} ${patient.last_name} — ${patient.mrn}` : "Unknown patient"}</h2>
                <p className="mt-1 text-sm text-white/50">{selectedVisit.presenting_complaint}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="text-2xl leading-none text-white/50 hover:text-white">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {obs && [
                { label: "BP", value: `${obs.systolic_bp}/${obs.diastolic_bp}` },
                { label: "HR", value: `${obs.heart_rate} bpm` },
                { label: "SpO2", value: `${obs.o2_sat}%` },
                { label: "Temp", value: `${obs.temp_c}°C` },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-white/5 p-3">
                  <div className="text-xs text-white/50">{item.label}</div>
                  <div className="text-base font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <a href="/hospital/adt" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600">{lang === "en" ? "Admit to Ward" : "قبول في الجناح"}</a>
              <a href="/hospital/beds" className="rounded-lg border border-brand-400 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 hover:bg-brand-500/20">{lang === "en" ? "Find Bed" : "البحث عن سرير"}</a>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
