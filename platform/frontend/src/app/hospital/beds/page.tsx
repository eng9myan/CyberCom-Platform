"use client";

import { useState, useEffect, useCallback } from "react";
import { BedDouble } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type BedStatus = "available" | "occupied" | "maintenance" | "reserved";

interface Bed { id: string; bed_number: string; status: BedStatus; }
interface Room { id: string; room_number: string; room_type: string; beds: Bed[]; }
interface WardNode { id: string; name: string; code: string; rooms: Room[]; }
interface Department { id: string; name: string; code: string; wards: WardNode[]; }
interface Facility { id: string; name: string; departments: Department[]; }
interface Paginated<T> { count: number; results: T[]; }
interface BedAssignment { id: string; patient: string; bed: string; assigned_at: string; released_at: string | null; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }

const BED_COLORS: Record<BedStatus, { bg: string; border: string; text: string }> = {
  available: { bg: "#052e16", border: "#22c55e", text: "#22c55e" },
  occupied: { bg: "#1e1b4b", border: "#6366f1", text: "#a5b4fc" },
  reserved: { bg: "#1c1917", border: "#f59e0b", text: "#fbbf24" },
  maintenance: { bg: "#1f1f1f", border: "#6b7280", text: "#9ca3af" },
};

function wardBeds(ward: WardNode): Bed[] {
  return ward.rooms.flatMap(r => r.beds);
}

export default function BedsPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [assignments, setAssignments] = useState<BedAssignment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [facilityPage, assignmentPage, patientPage] = await Promise.all([
        apiFetch<Paginated<Facility>>("/api/v1/facilities/", opts),
        apiFetch<Paginated<BedAssignment>>("/api/v1/hospital/beds/assignments/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
      ]);
      setFacilities(facilityPage.results);
      setAssignments(assignmentPage.results);
      setPatients(patientPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load bed management data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load bed management data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (facilities === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live bed data...</div>;
  }

  const wards: WardNode[] = facilities.flatMap(f => f.departments.flatMap(d => d.wards));
  const allBeds = wards.flatMap(wardBeds);
  const activeAssignmentFor = (bedId: string) => assignments.find(a => a.bed === bedId && !a.released_at);
  const patientFor = (id: string) => patients.find(p => p.id === id);
  const hoursOccupied = (assignedAt: string) => Math.round((Date.now() - new Date(assignedAt).getTime()) / (1000 * 60 * 60));

  const globalSummary = {
    total: allBeds.length,
    available: allBeds.filter(b => b.status === "available").length,
    occupied: allBeds.filter(b => b.status === "occupied").length,
    reserved: allBeds.filter(b => b.status === "reserved").length,
    maintenance: allBeds.filter(b => b.status === "maintenance").length,
  };
  const occupancyPct = globalSummary.total ? Math.round((globalSummary.occupied / globalSummary.total) * 100) : 0;
  const displayWards = selectedWard ? wards.filter(w => w.id === selectedWard) : wards;

  return (
    <div dir={dir} style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><BedDouble size={22} /> {lang === "en" ? "Bed Management Board" : "لوحة إدارة الأسرة"}</h1>
          <p className="mt-1 text-sm text-white/50">{lang === "en" ? "Real-time ward and bed occupancy overview" : "نظرة فورية على إشغال الأجنحة والأسرة"}</p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium hover:bg-white/5">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: lang === "en" ? "Total Beds" : "إجمالي الأسرة", value: globalSummary.total, color: "#22D3EE" },
          { label: lang === "en" ? "Occupied" : "مشغولة", value: globalSummary.occupied, color: "#6366f1" },
          { label: lang === "en" ? "Available" : "متاحة", value: globalSummary.available, color: "#22c55e" },
          { label: lang === "en" ? "Reserved" : "محجوزة", value: globalSummary.reserved, color: "#f59e0b" },
          { label: lang === "en" ? "Maintenance" : "صيانة", value: globalSummary.maintenance, color: "#6b7280" },
        ].map(card => (
          <div key={card.label} className="rounded-xl border p-4 text-center" style={{ background: "var(--color-surface)", borderColor: `${card.color}44` }}>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="mt-1 text-xs text-white/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold">{lang === "en" ? "Overall Occupancy" : "الإشغال الكلي"}</span>
          <span className="text-xl font-bold" style={{ color: occupancyPct >= 90 ? "#ef4444" : occupancyPct >= 75 ? "#f59e0b" : "#22c55e" }}>{occupancyPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${occupancyPct}%`, background: occupancyPct >= 90 ? "#ef4444" : occupancyPct >= 75 ? "#f59e0b" : "#22c55e" }} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setSelectedWard(null)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${selectedWard === null ? "border-2 border-brand-400 bg-brand-500/15 text-brand-200" : "border border-white/10 bg-surface-overlay text-white/50"}`}>
          {lang === "en" ? "All Wards" : "جميع الأجنحة"}
        </button>
        {wards.map(w => (
          <button key={w.id} onClick={() => setSelectedWard(w.id === selectedWard ? null : w.id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${selectedWard === w.id ? "border-2 border-brand-400 bg-brand-500/15 text-brand-200" : "border border-white/10 bg-surface-overlay text-white/50"}`}>
            {w.name}
          </button>
        ))}
      </div>

      {wards.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-surface-raised p-6 text-center text-white/50">
          No wards/beds configured for this tenant's facility yet.
        </div>
      )}

      {displayWards.map(ward => {
        const beds = wardBeds(ward);
        const occupied = beds.filter(b => b.status === "occupied").length;
        const wardOcc = beds.length ? Math.round((occupied / beds.length) * 100) : 0;
        const wardColor = wardOcc >= 90 ? "#ef4444" : wardOcc >= 75 ? "#f59e0b" : "#22c55e";
        return (
          <div key={ward.id} className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{ward.name}</h2>
                <div className="mt-1 flex gap-4 text-xs">
                  <span className="text-green-400">{beds.filter(b => b.status === "available").length} {lang === "en" ? "available" : "متاح"}</span>
                  <span className="text-indigo-300">{occupied} {lang === "en" ? "occupied" : "مشغول"}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold" style={{ color: wardColor }}>{wardOcc}%</span>
                <div className="text-xs text-white/50">{lang === "en" ? "Occupancy" : "إشغال"}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {beds.map(bed => {
                const colors = BED_COLORS[bed.status];
                const assignment = bed.status === "occupied" ? activeAssignmentFor(bed.id) : undefined;
                const patient = assignment ? patientFor(assignment.patient) : undefined;
                return (
                  <div
                    key={bed.id}
                    onClick={() => setSelectedBed(selectedBed?.id === bed.id ? null : bed)}
                    title={patient ? `${patient.first_name} ${patient.last_name} (${patient.mrn})` : bed.status}
                    className="flex h-14 w-[72px] cursor-pointer flex-col items-center justify-center rounded-lg border-2"
                    style={{ background: colors.bg, borderColor: selectedBed?.id === bed.id ? "#22D3EE" : colors.border }}
                  >
                    <span className="text-xs font-bold" style={{ color: colors.text }}>{bed.bed_number}</span>
                    <span className="mt-0.5 text-[10px] opacity-80" style={{ color: colors.text }}>{bed.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedBed && (() => {
        const assignment = selectedBed.status === "occupied" ? activeAssignmentFor(selectedBed.id) : undefined;
        const patient = assignment ? patientFor(assignment.patient) : undefined;
        return (
          <div className="fixed bottom-8 right-8 z-50 min-w-[280px] rounded-xl border-2 border-brand-400 bg-surface-raised p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-brand-300">{lang === "en" ? "Bed" : "السرير"} {selectedBed.bed_number}</h3>
              <button onClick={() => setSelectedBed(null)} className="text-xl leading-none text-white/50 hover:text-white">×</button>
            </div>
            {selectedBed.status === "occupied" && patient && assignment ? (
              <>
                <div className="mb-2 text-sm"><span className="text-white/50">{lang === "en" ? "Patient" : "المريض"}: </span><span className="font-semibold">{patient.first_name} {patient.last_name}</span></div>
                <div className="mb-2 text-sm"><span className="text-white/50">MRN: </span><span className="font-semibold text-brand-300">{patient.mrn}</span></div>
                <div className="mb-3 text-sm"><span className="text-white/50">{lang === "en" ? "Time in bed" : "مدة الإقامة"}: </span><span className="font-semibold">{hoursOccupied(assignment.assigned_at)}h</span></div>
              </>
            ) : (
              <p className="mb-3 text-sm text-white/50">
                {selectedBed.status === "available" ? (lang === "en" ? "Bed is available for admission." : "السرير متاح للقبول.") :
                 selectedBed.status === "reserved" ? (lang === "en" ? "Bed is reserved." : "السرير محجوز.") :
                 (lang === "en" ? "Bed is under maintenance." : "السرير قيد الصيانة.")}
              </p>
            )}
            <div className="flex gap-2">
              {selectedBed.status === "available" && (
                <a href="/hospital/adt" className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold hover:bg-brand-600">{lang === "en" ? "Admit Patient" : "قبول مريض"}</a>
              )}
              {selectedBed.status === "occupied" && (
                <a href="/hospital/adt" className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-green-600">{lang === "en" ? "Discharge / Transfer" : "خروج / نقل"}</a>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
