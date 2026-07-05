"use client";

import { useState, useEffect, useCallback } from "react";
import { HeartPulse } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ICUStay {
  id: string;
  stay: string;
  icu_admitted_at: string;
  icu_released_at: string | null;
  ventilator_status: string;
  invasive_lines_count: number;
}
interface HospitalStay { id: string; admission: string; current_code_status: string; }
interface Admission { id: string; encounter: string; admitting_physician_id: string; }
interface Encounter { id: string; patient: string; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface ICUAssessment { id: string; icu_stay: string; assessed_at: string; sofa_score: number; apache_ii_score: number; glasgow_coma_scale: number; }
interface CriticalEvent { id: string; icu_stay: string; event_time: string; event_type: string; details: string; }
interface Paginated<T> { count: number; results: T[]; }

export default function ICUPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [stays, setStays] = useState<ICUStay[] | null>(null);
  const [hospitalStays, setHospitalStays] = useState<HospitalStay[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<ICUAssessment[]>([]);
  const [criticalEvents, setCriticalEvents] = useState<CriticalEvent[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [stayPage, hospitalStayPage, admissionPage, encounterPage, patientPage, assessmentPage, eventPage] = await Promise.all([
        apiFetch<Paginated<ICUStay>>("/api/v1/hospital/icu/stays/", opts),
        apiFetch<Paginated<HospitalStay>>("/api/v1/hospital/inpatient/stays/", opts),
        apiFetch<Paginated<Admission>>("/api/v1/hospital/adt/admissions/", opts),
        apiFetch<Paginated<Encounter>>("/api/v1/encounters/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
        apiFetch<Paginated<ICUAssessment>>("/api/v1/hospital/icu/assessments/", opts),
        apiFetch<Paginated<CriticalEvent>>("/api/v1/hospital/icu/critical-events/", opts),
      ]);
      setStays(stayPage.results);
      setHospitalStays(hospitalStayPage.results);
      setAdmissions(admissionPage.results);
      setEncounters(encounterPage.results);
      setPatients(patientPage.results);
      setAssessments(assessmentPage.results);
      setCriticalEvents(eventPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load ICU data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load ICU data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (stays === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live ICU data...</div>;
  }

  const activeStays = stays.filter(s => !s.icu_released_at);
  const patientFor = (stayId: string): Patient | undefined => {
    const hStay = hospitalStays.find(h => h.id === stayId);
    if (!hStay) return undefined;
    const admission = admissions.find(a => a.id === hStay.admission);
    if (!admission) return undefined;
    const encounter = encounters.find(e => e.id === admission.encounter);
    if (!encounter) return undefined;
    return patients.find(p => p.id === encounter.patient);
  };
  const latestAssessment = (stayId: string): ICUAssessment | undefined =>
    assessments.filter(a => a.icu_stay === stayId).sort((a, b) => b.assessed_at.localeCompare(a.assessed_at))[0];
  const eventsFor = (stayId: string) => criticalEvents.filter(e => e.icu_stay === stayId);
  const daysInICU = (admittedAt: string) => Math.max(1, Math.round((Date.now() - new Date(admittedAt).getTime()) / (1000 * 60 * 60 * 24)));

  const ventCount = activeStays.filter(s => s.ventilator_status !== "none").length;
  const apacheScores = activeStays.map(s => latestAssessment(s.id)?.apache_ii_score).filter((v): v is number => v !== undefined);
  const avgApache = apacheScores.length ? Math.round(apacheScores.reduce((a, v) => a + v, 0) / apacheScores.length) : null;
  const avgLOS = activeStays.length ? Math.round(activeStays.reduce((a, s) => a + daysInICU(s.icu_admitted_at), 0) / activeStays.length) : 0;

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
  };

  return (
    <div style={s.page} dir={isAr ? "rtl" : "ltr"}>
      <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><HeartPulse size={22} /> {isAr ? "وحدة العناية المركزة" : "Intensive Care Unit"}</h1>
          <p className="mt-1 text-sm text-white/50">{activeStays.length} {isAr ? "مريض نشط" : "active patients"}</p>
        </div>
        <button onClick={() => setLang(isAr ? "en" : "ar")} className="rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium hover:bg-white/5">
          {isAr ? "English" : "العربية"}
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: isAr ? "إجمالي المرضى" : "Active Patients", value: activeStays.length, color: "#22D3EE" },
          { label: isAr ? "على التنفس الصناعي" : "Ventilated", value: ventCount, color: "#f59e0b" },
          { label: isAr ? "متوسط APACHE II" : "Avg APACHE II", value: avgApache ?? "—", color: "#a78bfa" },
          { label: isAr ? "متوسط الإقامة (أيام)" : "Avg LOS (days)", value: avgLOS, color: "#22c55e" },
          { label: isAr ? "أحداث حرجة" : "Critical Events", value: criticalEvents.length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-surface-raised p-4">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-white/50">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {[isAr ? "المريض" : "Patient", isAr ? "أيام العناية" : "Days ICU", isAr ? "تنفس صناعي" : "Ventilator", "SOFA", "APACHE II", "GCS", isAr ? "حالة الرمز" : "Code Status", isAr ? "أحداث حرجة" : "Critical Events"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeStays.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-white/50">No patients currently in ICU.</td></tr>
              )}
              {activeStays.map(stay => {
                const patient = patientFor(stay.id);
                const assessment = latestAssessment(stay.id);
                const hStay = hospitalStays.find(h => h.id === stay.stay);
                const events = eventsFor(stay.id);
                return (
                  <tr key={stay.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium">
                      {patient ? `${patient.first_name} ${patient.last_name} (${patient.mrn})` : "Unknown patient"}
                    </td>
                    <td className="px-4 py-3 text-white/60">{daysInICU(stay.icu_admitted_at)}</td>
                    <td className="px-4 py-3">
                      {stay.ventilator_status === "none" ? (
                        <span className="text-white/50">No</span>
                      ) : (
                        <span className="font-semibold text-amber-400 capitalize">{stay.ventilator_status.replace("_", " ")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{assessment?.sofa_score ?? "—"}</td>
                    <td className="px-4 py-3">
                      {assessment ? (
                        <span className="font-bold" style={{ color: assessment.apache_ii_score >= 25 ? "#ef4444" : assessment.apache_ii_score >= 15 ? "#f59e0b" : "#22c55e" }}>
                          {assessment.apache_ii_score}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">{assessment?.glasgow_coma_scale ?? "—"}</td>
                    <td className="px-4 py-3 text-white/60 capitalize">{hStay?.current_code_status.replace("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3">
                      {events.length === 0 ? <span className="text-white/30">—</span> : events.map(e => (
                        <div key={e.id} className="mb-1 text-xs text-amber-400">⚠ {e.event_type}: {e.details}</div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
