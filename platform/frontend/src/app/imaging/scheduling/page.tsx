"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface AppointmentRaw {
  id: string;
  patient_id: string;
  room: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}

interface RoomRaw {
  id: string;
  name: string;
  modality_type: string;
}

interface PatientRaw {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  confirmed: "#3b82f6",
  arrived: "#f59e0b",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  cancelled: "#ef4444",
  no_show: "#ef4444",
  rescheduled: "#6b7280",
};

export default function ImagingSchedulingPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [appointments, setAppointments] = useState<AppointmentRaw[] | null>(null);
  const [rooms, setRooms] = useState<Record<string, RoomRaw>>({});
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [apptData, roomsData, patientsData] = await Promise.all([
        apiFetch<Paginated<AppointmentRaw> | AppointmentRaw[]>("/api/v1/imaging/scheduling/appointments/", opts),
        apiFetch<Paginated<RoomRaw> | RoomRaw[]>("/api/v1/imaging/scheduling/rooms/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setAppointments(unwrap(apptData));
      const roomMap: Record<string, RoomRaw> = {};
      for (const r of unwrap(roomsData)) roomMap[r.id] = r;
      setRooms(roomMap);
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load schedule."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sorted = [...(appointments || [])].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/imaging" className="text-sm text-brand-400 hover:underline">{t("← Imaging", "← الأشعة")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Imaging Schedule", "جدول الأشعة")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real room/modality appointment schedule", "جدول مواعيد حقيقي للغرف والأجهزة")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} className={`rounded-md px-4 py-1.5 text-sm font-medium ${item.href === "/imaging/scheduling" ? "border border-brand-400 bg-brand-500/15 text-brand-400" : "border border-ink/10 bg-surface text-ink"}`}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3.5 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {loading && <p className="mb-4 text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</p>}

      <div className="cy-card overflow-hidden p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {[t("Time", "الوقت"), t("Room", "الغرفة"), t("Patient", "المريض"), t("Status", "الحالة")].map(h => (
                <th key={h} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && sorted.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-ink/40">
                {t("No imaging appointments scheduled for this tenant yet.", "لا توجد مواعيد أشعة مجدولة لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {sorted.map((appt) => {
              const room = appt.room ? rooms[appt.room] : null;
              const patient = patients[appt.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${appt.patient_id.slice(0, 8)}`;
              return (
                <tr key={appt.id} className="border-b border-ink/10">
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {new Date(appt.scheduled_start).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm">{room ? `${room.name} (${room.modality_type})` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{patientLabel}</div>
                    {patient?.mrn && <div className="text-xs text-ink/50">{patient.mrn}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: (STATUS_COLORS[appt.status] || "#6b7280") + "22", color: STATUS_COLORS[appt.status] || "#6b7280" }}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
