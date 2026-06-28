"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PatientVisit {
  patient_id: string;
  name: string;
  name_ar: string;
  time: string;
  reason: string;
  status: string;
}

interface ClinicalAlert {
  id: string;
  patient_name: string;
  type: string;
  message: string;
  severity: "critical" | "warning" | "info";
}

const VISITS: PatientVisit[] = [
  { patient_id: "p1", name: "Ahmad Kamal", name_ar: "أحمد كمال", time: "09:00", reason: "Diabetes review", status: "arrived" },
  { patient_id: "p2", name: "Mariam Al-Rashid", name_ar: "مريم الرشيد", time: "10:30", reason: "Hypertension checkup", status: "waiting" },
  { patient_id: "p3", name: "Fatima Al-Harbi", name_ar: "فاطمة الحربي", time: "11:15", reason: "Post-op consult", status: "scheduled" },
];

const ALERTS: ClinicalAlert[] = [
  { id: "a1", patient_name: "Ahmad Kamal", type: "Critical Lab Value", message: "Potassium 6.2 mmol/L (Critical High)", severity: "critical" },
  { id: "a2", patient_name: "Mariam Al-Rashid", type: "Drug Interaction", message: "Warfarin × Aspirin (Contraindicated / Major Risk)", severity: "warning" },
  { id: "a3", patient_name: "Fatima Al-Harbi", type: "Risk Stratification", message: "Patient risk profile evaluated as High (MELD score)", severity: "info" },
];

export default function ProviderPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [visits, setVisits] = useState<PatientVisit[]>(VISITS);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>(ALERTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProviderData() {
      setLoading(true);
      try {
        // Fetch active clinic queue or active tasks
        const appointments = await apiFetch<any[]>("/api/v1/patient-portal/appointments/my-appointments/");
        if (appointments && appointments.length > 0) {
          // Map to queue
        }
      } catch (err) {
        console.warn("Failed to fetch live provider portal data, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProviderData();
  }, []);

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Provider Workspace" : "مساحة عمل الطبيب سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Clinician Queue, Diagnostics Order & Critical Alerts Center" : "طابور عيادة الطبيب، طلب التحاليل والأشعة ومركز التنبيهات الحرجة"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
        
        {/* Left Panel: Clinic Queue */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Today's Patient Queue" : "طابور المرضى اليوم"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {visits.map((visit) => (
              <div key={visit.patient_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem" }}>{lang === "en" ? visit.name : visit.name_ar}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    {visit.time} — {visit.reason}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    background: visit.status === "arrived" ? "#d1fae5" : "#fef3c7",
                    color: visit.status === "arrived" ? "#065f46" : "#92400e"
                  }}>
                    {visit.status.toUpperCase()}
                  </span>
                  <button style={{ padding: "0.5rem 1rem", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
                    {lang === "en" ? "Consult" : "معاينة"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Alerts and Notifications */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Clinical Decision Support & Alerts" : "دعم القرار السريري والتنبيهات"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {alerts.map((alert) => {
              const borderCol = alert.severity === "critical" ? "#ef4444" : alert.severity === "warning" ? "#f59e0b" : "#3b82f6";
              const bgCol = alert.severity === "critical" ? "rgba(239,68,68,0.05)" : alert.severity === "warning" ? "rgba(245,158,11,0.05)" : "rgba(59,130,246,0.05)";
              return (
                <div key={alert.id} style={{ borderLeft: `4px solid ${borderCol}`, padding: "1rem", background: bgCol, borderRadius: "0 8px 8px 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: borderCol }}>{alert.type}</span>
                    <button onClick={() => handleDismissAlert(alert.id)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.8125rem" }}>
                      ✕
                    </button>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{alert.patient_name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{alert.message}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
