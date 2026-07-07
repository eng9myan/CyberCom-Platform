"use client";

import { usePreferences } from "@/contexts/preferences";

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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load ADT data</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (admissions === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading live ADT data...</div>;
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

  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";

  function typeColor(type: string) { return type === "admit" ? "#22D3EE" : type === "discharge" ? "#22c55e" : "#f59e0b"; }
  const tabAccent: Record<typeof activeTab, string> = { log: "text-brand-400", admit: "text-brand-400", discharge: "text-emerald-400", transfer: "text-amber-400" };

  return (
    <div dir={dir} className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "Admit / Discharge / Transfer" : "القبول / الخروج / النقل"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Manage all patient movement transactions" : "إدارة جميع حركات المرضى"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: lang === "en" ? "Admissions Today" : "قبول اليوم", value: admitCount, color: "#22D3EE" },
          { label: lang === "en" ? "Discharges Today" : "خروج اليوم", value: dischargeCount, color: "#22c55e" },
          { label: lang === "en" ? "Transfers Today" : "نقل اليوم", value: transferCount, color: "#f59e0b" },
        ].map(card => (
          <div key={card.label} className="cy-card p-5 text-center" style={{ borderColor: `${card.color}44` }}>
            <div className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</div>
            <div className="mt-1 text-sm font-medium text-ink/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2 border-b border-ink/10">
        {(["log", "admit", "discharge", "transfer"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFormSuccess(null); setFormError(null); }}
            className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold transition ${activeTab === tab ? `border-current ${tabAccent[tab]}` : "border-transparent text-ink/50 hover:text-ink"}`}
          >
            {tab === "log" ? (lang === "en" ? "ADT Log" : "سجل الحركات") : tab === "admit" ? (lang === "en" ? "New Admission" : "قبول جديد") : tab === "discharge" ? (lang === "en" ? "Discharge" : "خروج") : (lang === "en" ? "Transfer" : "نقل")}
          </button>
        ))}
      </div>

      {formSuccess && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-sm font-semibold text-emerald-400">{formSuccess}</div>}
      {formError && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-3.5 text-sm font-semibold text-red-400">{formError}</div>}

      {activeTab === "log" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "admit", "discharge", "transfer"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filterType === f ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}
              >
                {f === "all" ? (lang === "en" ? "All" : "الكل") : f === "admit" ? (lang === "en" ? "Admissions" : "قبول") : f === "discharge" ? (lang === "en" ? "Discharges" : "خروج") : (lang === "en" ? "Transfers" : "نقل")}
              </button>
            ))}
          </div>
          <div className="cy-card overflow-auto p-0">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  {[lang === "en" ? "Type" : "النوع", lang === "en" ? "Patient" : "المريض", lang === "en" ? "Physician" : "الطبيب", lang === "en" ? "Reason" : "السبب", lang === "en" ? "Time" : "الوقت", lang === "en" ? "Status" : "الحالة"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-ink/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-sm text-ink/40">No ADT transactions for this tenant yet.</td></tr>
                )}
                {filteredLog.map(tx => (
                  <tr key={tx.id} className="border-b border-ink/5">
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-3 py-1 text-xs font-bold capitalize" style={{ background: typeColor(tx.kind) + "22", color: typeColor(tx.kind) }}>{tx.kind}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold">{patientName(tx.patient)}</td>
                    <td className="px-4 py-3.5 text-xs text-ink/50">{providerName(tx.physician)}</td>
                    <td className="max-w-[220px] px-4 py-3.5 text-xs text-ink/50">{tx.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink/50">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold capitalize text-ink/50">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "admit" && (
        <div className="cy-card p-6">
          <h2 className="mb-6 text-lg font-bold text-brand-400">{lang === "en" ? "New Patient Admission" : "قبول مريض جديد"}</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>{lang === "en" ? "Patient" : "المريض"}</label>
              <select className={inputCls} value={admitForm.patient} onChange={e => setAdmitForm({ ...admitForm, patient: e.target.value, encounter: "" })}>
                <option value="">{lang === "en" ? "Select patient..." : "اختر المريض..."}</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Encounter" : "الزيارة"}</label>
              <select className={inputCls} value={admitForm.encounter} onChange={e => setAdmitForm({ ...admitForm, encounter: e.target.value })} disabled={!admitForm.patient}>
                <option value="">{patientEncounters.length === 0 && admitForm.patient ? (lang === "en" ? "No encounters for this patient" : "لا توجد زيارات لهذا المريض") : (lang === "en" ? "Select encounter..." : "اختر الزيارة...")}</option>
                {patientEncounters.map(e => <option key={e.id} value={e.id}>{e.id.slice(0, 8)} — {e.status}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Attending Physician" : "الطبيب المعالج"}</label>
              <select className={inputCls} value={admitForm.physician} onChange={e => setAdmitForm({ ...admitForm, physician: e.target.value })}>
                <option value="">{lang === "en" ? "Select physician..." : "اختر الطبيب..."}</option>
                {providers.map(p => <option key={p.id} value={p.id}>Dr. {p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Bed Assignment (optional)" : "تعيين السرير (اختياري)"}</label>
              <select className={inputCls} value={admitForm.bed} onChange={e => setAdmitForm({ ...admitForm, bed: e.target.value })}>
                <option value="">{lang === "en" ? "No bed yet" : "بدون سرير حالياً"}</option>
                {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Admission Type" : "نوع القبول"}</label>
              <select className={inputCls} value={admitForm.admissionType} onChange={e => setAdmitForm({ ...admitForm, admissionType: e.target.value })}>
                <option value="">{lang === "en" ? "Select type..." : "اختر النوع..."}</option>
                {admissionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Admission Reason" : "سبب القبول"}</label>
              <select className={inputCls} value={admitForm.admissionReason} onChange={e => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}>
                <option value="">{lang === "en" ? "Select reason..." : "اختر السبب..."}</option>
                {admissionReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button className="cy-btn cy-btn-primary disabled:opacity-50" disabled={submitting || !admitForm.patient || !admitForm.encounter || !admitForm.physician || !admitForm.admissionType || !admitForm.admissionReason} onClick={submitAdmit}>
              {submitting ? (lang === "en" ? "Submitting..." : "جارٍ الإرسال...") : (lang === "en" ? "Submit Admission" : "إرسال طلب القبول")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "discharge" && (
        <div className="cy-card p-6">
          <h2 className="mb-6 text-lg font-bold text-emerald-400">{lang === "en" ? "Patient Discharge" : "خروج المريض"}</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Open Admission" : "القبول المفتوح"}</label>
              <select className={inputCls} value={dischargeForm.admission} onChange={e => setDischargeForm({ ...dischargeForm, admission: e.target.value })}>
                <option value="">{lang === "en" ? "Select admission..." : "اختر القبول..."}</option>
                {openAdmissions.map(a => <option key={a.id} value={a.id}>{patientName(patientForEncounter(a.encounter))} — {new Date(a.admitted_at).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Discharge Disposition" : "وجهة الخروج"}</label>
              <select className={inputCls} value={dischargeForm.disposition} onChange={e => setDischargeForm({ ...dischargeForm, disposition: e.target.value })}>
                <option value="">{lang === "en" ? "Select disposition..." : "اختر الوجهة..."}</option>
                {dischargeDispositions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === "en" ? "Discharge Reason" : "سبب الخروج"}</label>
              <select className={inputCls} value={dischargeForm.reason} onChange={e => setDischargeForm({ ...dischargeForm, reason: e.target.value })}>
                <option value="">{lang === "en" ? "Select reason..." : "اختر السبب..."}</option>
                {dischargeReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Discharge Summary" : "ملخص الخروج"}</label>
              <textarea className={`${inputCls} h-[90px] resize-y`} value={dischargeForm.summary} onChange={e => setDischargeForm({ ...dischargeForm, summary: e.target.value })} placeholder={lang === "en" ? "Clinical summary..." : "الملخص السريري..."} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Instructions" : "التعليمات"}</label>
              <textarea className={`${inputCls} h-[90px] resize-y`} value={dischargeForm.instructions} onChange={e => setDischargeForm({ ...dischargeForm, instructions: e.target.value })} placeholder={lang === "en" ? "Discharge instructions..." : "تعليمات الخروج..."} />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button className="cy-btn bg-emerald-500 text-white disabled:opacity-50" disabled={submitting || !dischargeForm.admission || !dischargeForm.disposition || !dischargeForm.reason} onClick={submitDischarge}>
              {submitting ? (lang === "en" ? "Processing..." : "جارٍ التنفيذ...") : (lang === "en" ? "Process Discharge" : "تنفيذ الخروج")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="cy-card p-6">
          <h2 className="mb-6 text-lg font-bold text-amber-400">{lang === "en" ? "Patient Transfer" : "نقل المريض"}</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Open Admission" : "القبول المفتوح"}</label>
              <select className={inputCls} value={transferForm.admission} onChange={e => setTransferForm({ ...transferForm, admission: e.target.value })}>
                <option value="">{lang === "en" ? "Select admission..." : "اختر القبول..."}</option>
                {openAdmissions.map(a => <option key={a.id} value={a.id}>{patientName(patientForEncounter(a.encounter))} — {new Date(a.admitted_at).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Target Bed" : "السرير المستهدف"}</label>
              <select className={inputCls} value={transferForm.targetBed} onChange={e => setTransferForm({ ...transferForm, targetBed: e.target.value })}>
                <option value="">{lang === "en" ? "Select bed..." : "اختر السرير..."}</option>
                {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{lang === "en" ? "Transfer Reason" : "سبب النقل"}</label>
              <textarea className={`${inputCls} h-[90px] resize-y`} value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder={lang === "en" ? "Reason for patient transfer..." : "سبب نقل المريض..."} />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button className="cy-btn bg-amber-500 text-white disabled:opacity-50" disabled={submitting || !transferForm.admission || !transferForm.targetBed} onClick={submitTransfer}>
              {submitting ? (lang === "en" ? "Submitting..." : "جارٍ الإرسال...") : (lang === "en" ? "Initiate Transfer" : "بدء النقل")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
