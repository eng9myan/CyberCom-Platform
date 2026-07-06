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
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  const sorted = [...(appointments || [])].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/imaging" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Imaging", "← الأشعة")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Imaging Schedule", "جدول الأشعة")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real room/modality appointment schedule", "جدول مواعيد حقيقي للغرف والأجهزة")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/imaging/scheduling" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/imaging/scheduling" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/imaging/scheduling" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{t("Loading…", "جارٍ التحميل…")}</p>}

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Time", "الوقت"), t("Room", "الغرفة"), t("Patient", "المريض"), t("Status", "الحالة")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && sorted.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                {t("No imaging appointments scheduled for this tenant yet.", "لا توجد مواعيد أشعة مجدولة لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {sorted.map((appt, i) => {
              const room = appt.room ? rooms[appt.room] : null;
              const patient = patients[appt.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${appt.patient_id.slice(0, 8)}`;
              return (
                <tr key={appt.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-background)" }}>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {new Date(appt.scheduled_start).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{room ? `${room.name} (${room.modality_type})` : "—"}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{patientLabel}</div>
                    {patient?.mrn && <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{patient.mrn}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: (STATUS_COLORS[appt.status] || "#6b7280") + "22", color: STATUS_COLORS[appt.status] || "#6b7280" }}>
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
