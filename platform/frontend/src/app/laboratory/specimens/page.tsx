"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface SpecimenRaw {
  id: string;
  specimen_number: string;
  barcode: string;
  patient_id: string;
  specimen_type: string;
  collection_site: string;
  container_type: string;
  status: string;
  collected_at: string | null;
  received_at: string | null;
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
  pending: "#6b7280",
  collected: "#3b82f6",
  in_transit: "#f59e0b",
  received: "#3b82f6",
  accessioned: "#6366f1",
  in_processing: "#f59e0b",
  stored: "#22c55e",
  rejected: "#ef4444",
  disposed: "#6b7280",
};

export default function SpecimensPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [specimens, setSpecimens] = useState<SpecimenRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [specimensData, patientsData] = await Promise.all([
        apiFetch<Paginated<SpecimenRaw> | SpecimenRaw[]>("/api/v1/lab/specimens/specimens/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setSpecimens(unwrap(specimensData));
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load specimens."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateStatus(id: string, status: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/lab/specimens/specimens/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  const filtered = (specimens || []).filter(s => statusFilter === "all" || s.status === statusFilter);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Laboratory", "← المختبر")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Specimen Tracking", "تتبع العينات")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real specimen chain-of-custody", "سلسلة حفظ العينات الحقيقية")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/specimens" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/specimens" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/specimens" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "pending", "collected", "in_transit", "received", "accessioned", "in_processing", "stored", "rejected"].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.3rem 0.7rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
            {f === "all" ? t("All", "الكل") : f}
          </button>
        ))}
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>{t("Loading…", "جارٍ التحميل…")}</span>}
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          {t("Showing", "عرض")} {filtered.length} / {(specimens || []).length}
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Specimen #", "رقم العينة"), t("Patient", "المريض"), t("Type", "النوع"), t("Site", "موقع الجمع"), t("Status", "الحالة"), t("Collected", "وقت الجمع"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                {t("No specimens for this tenant yet.", "لا توجد عينات لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {filtered.map((sp, i) => {
              const patient = patients[sp.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${sp.patient_id.slice(0, 8)}`;
              return (
                <tr key={sp.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-background)" }}>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE" }}>{sp.specimen_number}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{patientLabel}</div>
                    {patient?.mrn && <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{patient.mrn}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{sp.specimen_type}</td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{sp.collection_site || "—"}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: (STATUS_COLORS[sp.status] || "#6b7280") + "22", color: STATUS_COLORS[sp.status] || "#6b7280" }}>
                      {sp.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {sp.collected_at ? new Date(sp.collected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {sp.status === "collected" && (
                        <button disabled={busyId === sp.id} onClick={() => updateStatus(sp.id, "received")} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap", opacity: busyId === sp.id ? 0.5 : 1 }}>
                          {t("Receive", "استلام")}
                        </button>
                      )}
                      {(sp.status === "pending" || sp.status === "collected" || sp.status === "received") && (
                        <button disabled={busyId === sp.id} onClick={() => updateStatus(sp.id, "rejected")} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#ef444422", color: "#ef4444", border: "1px solid #ef4444", cursor: "pointer", whiteSpace: "nowrap", opacity: busyId === sp.id ? 0.5 : 1 }}>
                          {t("Reject", "رفض")}
                        </button>
                      )}
                    </div>
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
