"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type AdmissionStatus = "admitted" | "discharged";

interface Admission {
  id: string;
  encounter: string;
  admission_type: string;
  admission_reason: string;
  admitting_physician_id: string;
  admitted_at: string;
  status: AdmissionStatus;
}
interface DischargeSummary { id: string; admission: string; discharged_at: string; discharged_by: string; disposition: string; reason: string; summary_text: string; instructions: string; }
interface TransferRequest { id: string; patient: string; encounter: string; source_bed_id: string | null; target_bed_id: string; requested_by: string; requested_at: string; status: string; reason: string; }
interface RefEntity { id: string; name: string; code: string; }
interface Encounter { id: string; patient: string; status: string; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Provider { id: string; first_name: string; last_name: string; }
interface Bed { id: string; bed_number: string; status: string; }
interface Facility { id: string; departments: { wards: { rooms: { beds: Bed[] }[] }[] }[]; }
interface Paginated<T> { count: number; results: T[]; }

function patientName(p?: Patient) { return p ? `${p.first_name} ${p.last_name} (${p.mrn})` : "Unknown patient"; }
function providerName(p?: Provider) { return p ? `Dr. ${p.first_name} ${p.last_name}` : "—"; }

export default function ADTPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [admissions, setAdmissions] = useState<Admission[] | null>(null);
  const [discharges, setDischarges] = useState<DischargeSummary[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<RefEntity[]>([]);
  const [admissionReasons, setAdmissionReasons] = useState<RefEntity[]>([]);
  const [dischargeReasons, setDischargeReasons] = useState<RefEntity[]>([]);
  const [dischargeDispositions, setDischargeDispositions] = useState<RefEntity[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"log" | "admit" | "discharge" | "transfer">("log");
  const [filterType, setFilterType] = useState<"all" | "admit" | "discharge" | "transfer">("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [admitForm, setAdmitForm] = useState({ patient: "", encounter: "", admissionType: "", admissionReason: "", physician: "", bed: "" });
  const [dischargeForm, setDischargeForm] = useState({ admission: "", disposition: "", reason: "", instructions: "", summary: "" });
  const [transferForm, setTransferForm] = useState({ admission: "", targetBed: "", reason: "" });

  const dir = lang === "ar" ? "rtl" : "ltr";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [admPage, dcPage, trPage, encPage, patPage, provPage, atPage, arPage, drPage, ddPage, facPage] = await Promise.all([
        apiFetch<Paginated<Admission>>("/api/v1/hospital/adt/admissions/", opts),
        apiFetch<Paginated<DischargeSummary>>("/api/v1/hospital/adt/discharge-summaries/", opts),
        apiFetch<Paginated<TransferRequest>>("/api/v1/hospital/adt/transfer-requests/", opts),
        apiFetch<Paginated<Encounter>>("/api/v1/encounters/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
        apiFetch<Paginated<Provider>>("/api/v1/providers/", opts),
        apiFetch<Paginated<RefEntity>>("/api/v1/hospital/adt/types/", opts),
        apiFetch<Paginated<RefEntity>>("/api/v1/hospital/adt/reasons/", opts),
        apiFetch<Paginated<RefEntity>>("/api/v1/hospital/adt/discharge-reasons/", opts),
        apiFetch<Paginated<RefEntity>>("/api/v1/hospital/adt/dispositions/", opts),
        apiFetch<Paginated<Facility>>("/api/v1/facilities/", opts),
      ]);
      setAdmissions(admPage.results);
      setDischarges(dcPage.results);
      setTransfers(trPage.results);
      setEncounters(encPage.results);
      setPatients(patPage.results);
      setProviders(provPage.results);
      setAdmissionTypes(atPage.results);
      setAdmissionReasons(arPage.results);
      setDischargeReasons(drPage.results);
      setDischargeDispositions(ddPage.results);
      const allBeds = facPage.results.flatMap(f => f.departments.flatMap(d => d.wards.flatMap(w => w.rooms.flatMap(r => r.beds))));
      setBeds(allBeds);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load ADT data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  const patientForEncounter = (encounterId: string) => {
    const enc = encounters.find(e => e.id === encounterId);
    return enc ? patients.find(p => p.id === enc.patient) : undefined;
  };
  const patientForAdmission = (admissionId: string) => {
    const adm = admissions?.find(a => a.id === admissionId);
    return adm ? patientForEncounter(adm.encounter) : undefined;
  };

  async function submitAdmit() {
    if (!session) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/api/v1/hospital/adt/admissions/admit/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          patient_id: admitForm.patient,
          encounter_id: admitForm.encounter,
          admission_type_id: admitForm.admissionType,
          admission_reason_id: admitForm.admissionReason,
          admitting_physician_id: admitForm.physician,
          bed_id: admitForm.bed || undefined,
        }),
      });
      setFormSuccess(lang === "en" ? "Admission submitted successfully." : "تم إرسال طلب القبول بنجاح.");
      setAdmitForm({ patient: "", encounter: "", admissionType: "", admissionReason: "", physician: "", bed: "" });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to submit admission."));
    } finally {
      setSubmitting(false);
      setTimeout(() => setFormSuccess(null), 4000);
    }
  }

  async function submitDischarge() {
    if (!session) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch(`/api/v1/hospital/adt/admissions/${dischargeForm.admission}/discharge/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          disposition_id: dischargeForm.disposition,
          reason_id: dischargeForm.reason,
          summary_text: dischargeForm.summary,
          instructions: dischargeForm.instructions,
          discharged_by: session.userId,
        }),
      });
      setFormSuccess(lang === "en" ? "Discharge processed successfully." : "تم تنفيذ الخروج بنجاح.");
      setDischargeForm({ admission: "", disposition: "", reason: "", instructions: "", summary: "" });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to process discharge."));
    } finally {
      setSubmitting(false);
      setTimeout(() => setFormSuccess(null), 4000);
    }
  }

  async function submitTransfer() {
    if (!session) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch(`/api/v1/hospital/adt/admissions/${transferForm.admission}/transfer/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          target_bed_id: transferForm.targetBed,
          reason: transferForm.reason,
          requested_by: session.userId,
        }),
      });
      setFormSuccess(lang === "en" ? "Transfer initiated successfully." : "تم بدء النقل بنجاح.");
      setTransferForm({ admission: "", targetBed: "", reason: "" });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to initiate transfer."));
    } finally {
      setSubmitting(false);
      setTimeout(() => setFormSuccess(null), 4000);
    }
  }

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load ADT data</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (admissions === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live ADT data...</div>;
  }

  const today = new Date().toDateString();
  const admitCount = admissions.filter(a => new Date(a.admitted_at).toDateString() === today).length;
  const dischargeCount = discharges.filter(d => new Date(d.discharged_at).toDateString() === today).length;
  const transferCount = transfers.filter(t => new Date(t.requested_at).toDateString() === today).length;
  const openAdmissions = admissions.filter(a => a.status === "admitted");
  const patientEncounters = admitForm.patient ? encounters.filter(e => e.patient === admitForm.patient) : [];
  const availableBeds = beds.filter(b => b.status === "available");

  type LogRow = { id: string; kind: "admit" | "discharge" | "transfer"; patient?: Patient; physician?: Provider; reason: string; timestamp: string; status: string };
  const logRows: LogRow[] = [
    ...admissions.map((a): LogRow => ({ id: a.id, kind: "admit", patient: patientForEncounter(a.encounter), physician: providers.find(p => p.id === a.admitting_physician_id), reason: admissionReasons.find(r => r.id === a.admission_reason)?.name ?? "—", timestamp: a.admitted_at, status: a.status })),
    ...discharges.map((d): LogRow => ({ id: d.id, kind: "discharge", patient: patientForAdmission(d.admission), reason: dischargeReasons.find(r => r.id === d.reason)?.name ?? "—", timestamp: d.discharged_at, status: "completed" })),
    ...transfers.map((t): LogRow => ({ id: t.id, kind: "transfer", patient: patients.find(p => p.id === t.patient), reason: t.reason, timestamp: t.requested_at, status: t.status })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const filteredLog = filterType === "all" ? logRows : logRows.filter(r => r.kind === filterType);

  const cardStyle: React.CSSProperties = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.625rem 0.875rem", background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text)", fontSize: "0.875rem", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem" };
  const btnPrimary: React.CSSProperties = { padding: "0.625rem 1.5rem", background: "#22D3EE", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" };

  function typeColor(type: string) { return type === "admit" ? "#22D3EE" : type === "discharge" ? "#22c55e" : "#f59e0b"; }

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Admit / Discharge / Transfer" : "القبول / الخروج / النقل"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Manage all patient movement transactions" : "إدارة جميع حركات المرضى"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Admissions Today" : "قبول اليوم", value: admitCount, color: "#22D3EE" },
          { label: lang === "en" ? "Discharges Today" : "خروج اليوم", value: dischargeCount, color: "#22c55e" },
          { label: lang === "en" ? "Transfers Today" : "نقل اليوم", value: transferCount, color: "#f59e0b" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: `1px solid ${card.color}44`, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-border)" }}>
        {(["log", "admit", "discharge", "transfer"] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setFormSuccess(null); setFormError(null); }} style={{ padding: "0.625rem 1.25rem", border: "none", borderBottom: activeTab === tab ? "3px solid #22D3EE" : "3px solid transparent", background: "transparent", color: activeTab === tab ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", marginBottom: "-2px" }}>
            {tab === "log" ? (lang === "en" ? "ADT Log" : "سجل الحركات") : tab === "admit" ? (lang === "en" ? "New Admission" : "قبول جديد") : tab === "discharge" ? (lang === "en" ? "Discharge" : "خروج") : (lang === "en" ? "Transfer" : "نقل")}
          </button>
        ))}
      </div>

      {formSuccess && <div style={{ background: "#052e16", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.875rem 1.25rem", marginBottom: "1rem", color: "#22c55e", fontWeight: 600, fontSize: "0.875rem" }}>{formSuccess}</div>}
      {formError && <div style={{ background: "#2e0505", border: "1px solid #ef4444", borderRadius: "8px", padding: "0.875rem 1.25rem", marginBottom: "1rem", color: "#ef4444", fontWeight: 600, fontSize: "0.875rem" }}>{formError}</div>}

      {activeTab === "log" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {(["all", "admit", "discharge", "transfer"] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)} style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: filterType === f ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: filterType === f ? "#22D3EE22" : "var(--color-surface)", color: filterType === f ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                {f === "all" ? (lang === "en" ? "All" : "الكل") : f === "admit" ? (lang === "en" ? "Admissions" : "قبول") : f === "discharge" ? (lang === "en" ? "Discharges" : "خروج") : (lang === "en" ? "Transfers" : "نقل")}
              </button>
            ))}
          </div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  {[lang === "en" ? "Type" : "النوع", lang === "en" ? "Patient" : "المريض", lang === "en" ? "Physician" : "الطبيب", lang === "en" ? "Reason" : "السبب", lang === "en" ? "Time" : "الوقت", lang === "en" ? "Status" : "الحالة"].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>No ADT transactions for this tenant yet.</td></tr>
                )}
                {filteredLog.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: typeColor(tx.kind) + "22", color: typeColor(tx.kind), textTransform: "capitalize" }}>{tx.kind}</span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>{patientName(tx.patient)}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{providerName(tx.physician)}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", maxWidth: "220px" }}>{tx.reason}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{new Date(tx.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.625rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "admit" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22D3EE", marginBottom: "1.5rem" }}>{lang === "en" ? "New Patient Admission" : "قبول مريض جديد"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Patient" : "المريض"}</label>
              <select style={inputStyle} value={admitForm.patient} onChange={e => setAdmitForm({ ...admitForm, patient: e.target.value, encounter: "" })}>
                <option value="">{lang === "en" ? "Select patient..." : "اختر المريض..."}</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Encounter" : "الزيارة"}</label>
              <select style={inputStyle} value={admitForm.encounter} onChange={e => setAdmitForm({ ...admitForm, encounter: e.target.value })} disabled={!admitForm.patient}>
                <option value="">{patientEncounters.length === 0 && admitForm.patient ? (lang === "en" ? "No encounters for this patient" : "لا توجد زيارات لهذا المريض") : (lang === "en" ? "Select encounter..." : "اختر الزيارة...")}</option>
                {patientEncounters.map(e => <option key={e.id} value={e.id}>{e.id.slice(0, 8)} — {e.status}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Attending Physician" : "الطبيب المعالج"}</label>
              <select style={inputStyle} value={admitForm.physician} onChange={e => setAdmitForm({ ...admitForm, physician: e.target.value })}>
                <option value="">{lang === "en" ? "Select physician..." : "اختر الطبيب..."}</option>
                {providers.map(p => <option key={p.id} value={p.id}>Dr. {p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Bed Assignment (optional)" : "تعيين السرير (اختياري)"}</label>
              <select style={inputStyle} value={admitForm.bed} onChange={e => setAdmitForm({ ...admitForm, bed: e.target.value })}>
                <option value="">{lang === "en" ? "No bed yet" : "بدون سرير حالياً"}</option>
                {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Admission Type" : "نوع القبول"}</label>
              <select style={inputStyle} value={admitForm.admissionType} onChange={e => setAdmitForm({ ...admitForm, admissionType: e.target.value })}>
                <option value="">{lang === "en" ? "Select type..." : "اختر النوع..."}</option>
                {admissionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Admission Reason" : "سبب القبول"}</label>
              <select style={inputStyle} value={admitForm.admissionReason} onChange={e => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}>
                <option value="">{lang === "en" ? "Select reason..." : "اختر السبب..."}</option>
                {admissionReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={{ ...btnPrimary, opacity: submitting ? 0.5 : 1 }} disabled={submitting || !admitForm.patient || !admitForm.encounter || !admitForm.physician || !admitForm.admissionType || !admitForm.admissionReason} onClick={submitAdmit}>
              {submitting ? (lang === "en" ? "Submitting..." : "جارٍ الإرسال...") : (lang === "en" ? "Submit Admission" : "إرسال طلب القبول")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "discharge" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22c55e", marginBottom: "1.5rem" }}>{lang === "en" ? "Patient Discharge" : "خروج المريض"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Open Admission" : "القبول المفتوح"}</label>
              <select style={inputStyle} value={dischargeForm.admission} onChange={e => setDischargeForm({ ...dischargeForm, admission: e.target.value })}>
                <option value="">{lang === "en" ? "Select admission..." : "اختر القبول..."}</option>
                {openAdmissions.map(a => <option key={a.id} value={a.id}>{patientName(patientForEncounter(a.encounter))} — {new Date(a.admitted_at).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Discharge Disposition" : "وجهة الخروج"}</label>
              <select style={inputStyle} value={dischargeForm.disposition} onChange={e => setDischargeForm({ ...dischargeForm, disposition: e.target.value })}>
                <option value="">{lang === "en" ? "Select disposition..." : "اختر الوجهة..."}</option>
                {dischargeDispositions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Discharge Reason" : "سبب الخروج"}</label>
              <select style={inputStyle} value={dischargeForm.reason} onChange={e => setDischargeForm({ ...dischargeForm, reason: e.target.value })}>
                <option value="">{lang === "en" ? "Select reason..." : "اختر السبب..."}</option>
                {dischargeReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Discharge Summary" : "ملخص الخروج"}</label>
              <textarea style={{ ...inputStyle, height: "90px", resize: "vertical" }} value={dischargeForm.summary} onChange={e => setDischargeForm({ ...dischargeForm, summary: e.target.value })} placeholder={lang === "en" ? "Clinical summary..." : "الملخص السريري..."} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Instructions" : "التعليمات"}</label>
              <textarea style={{ ...inputStyle, height: "90px", resize: "vertical" }} value={dischargeForm.instructions} onChange={e => setDischargeForm({ ...dischargeForm, instructions: e.target.value })} placeholder={lang === "en" ? "Discharge instructions..." : "تعليمات الخروج..."} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={{ ...btnPrimary, background: "#22c55e", opacity: submitting ? 0.5 : 1 }} disabled={submitting || !dischargeForm.admission || !dischargeForm.disposition || !dischargeForm.reason} onClick={submitDischarge}>
              {submitting ? (lang === "en" ? "Processing..." : "جارٍ التنفيذ...") : (lang === "en" ? "Process Discharge" : "تنفيذ الخروج")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "transfer" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1.5rem" }}>{lang === "en" ? "Patient Transfer" : "نقل المريض"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Open Admission" : "القبول المفتوح"}</label>
              <select style={inputStyle} value={transferForm.admission} onChange={e => setTransferForm({ ...transferForm, admission: e.target.value })}>
                <option value="">{lang === "en" ? "Select admission..." : "اختر القبول..."}</option>
                {openAdmissions.map(a => <option key={a.id} value={a.id}>{patientName(patientForEncounter(a.encounter))} — {new Date(a.admitted_at).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Target Bed" : "السرير المستهدف"}</label>
              <select style={inputStyle} value={transferForm.targetBed} onChange={e => setTransferForm({ ...transferForm, targetBed: e.target.value })}>
                <option value="">{lang === "en" ? "Select bed..." : "اختر السرير..."}</option>
                {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Transfer Reason" : "سبب النقل"}</label>
              <textarea style={{ ...inputStyle, height: "90px", resize: "vertical" }} value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder={lang === "en" ? "Reason for patient transfer..." : "سبب نقل المريض..."} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={{ ...btnPrimary, background: "#f59e0b", opacity: submitting ? 0.5 : 1 }} disabled={submitting || !transferForm.admission || !transferForm.targetBed} onClick={submitTransfer}>
              {submitting ? (lang === "en" ? "Submitting..." : "جارٍ الإرسال...") : (lang === "en" ? "Initiate Transfer" : "بدء النقل")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
