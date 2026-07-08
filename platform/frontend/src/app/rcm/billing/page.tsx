"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type BillingStatus = "open" | "coded" | "reviewed" | "billed" | "paid" | "partial" | "denied" | "written_off";

const STATUS_ORDER: BillingStatus[] = ["open", "coded", "reviewed", "billed"];

interface PatientAccount {
  id: string;
  patient_id: string;
  account_number: string;
  account_status: string;
  outstanding_balance: string;
}

interface EncounterBilling {
  id: string;
  patient_account: string;
  encounter_id: string;
  encounter_type: string;
  encounter_date: string;
  billing_status: BillingStatus;
  total_charges: string;
  balance_due: string;
  icd11_primary_diagnosis: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  amount_total: string;
  amount_outstanding: string;
  amount_paid: string;
  due_date: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

const STATUS_COLOR: Record<string, string> = {
  open: "#ef4444", coded: "#f59e0b", reviewed: "#f59e0b", billed: "#3b82f6",
  paid: "#22c55e", partial: "#f59e0b", denied: "#ef4444", written_off: "#6b7280",
};

export default function RCMBilling() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [encounters, setEncounters] = useState<EncounterBilling[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState<"all" | BillingStatus>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [accountsPage, encountersPage, invoicesPage, patientsPage] = await Promise.all([
        apiFetch<Paginated<PatientAccount>>("/api/v1/rcm/billing/patient-accounts/", opts),
        apiFetch<Paginated<EncounterBilling>>("/api/v1/rcm/billing/encounter-billings/", opts),
        apiFetch<Paginated<Invoice>>("/api/v1/rcm/billing/invoices/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
      ]);

      const patientById = new Map(patientsPage.results.map(p => [p.id, `${p.first_name} ${p.last_name} (${p.mrn})`]));
      const accountToPatient = new Map(accountsPage.results.map(a => [a.id, a.patient_id]));
      const names = new Map<string, string>();
      for (const [accountId, patientId] of accountToPatient) {
        const name = patientById.get(patientId);
        if (name) names.set(accountId, name);
      }

      setPatientNames(names);
      setEncounters(encountersPage.results);
      setInvoices(invoicesPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load billing data."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function advanceStatus(encounter: EncounterBilling) {
    const idx = STATUS_ORDER.indexOf(encounter.billing_status);
    if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    if (!session) return;
    try {
      await apiFetch(`/api/v1/rcm/billing/encounter-billings/${encounter.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ billing_status: nextStatus }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || "Failed to update billing status.");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold">{lang === "en" ? "Sign in required" : "تسجيل الدخول مطلوب"}</h1>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">{lang === "en" ? "Unable to load billing data" : "تعذر تحميل بيانات الفوترة"}</h1>
        <p className="mt-1 text-sm text-ink/50">{fetchError}</p>
      </div>
    );
  }

  if (loading || encounters === null || invoices === null) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">
        {lang === "en" ? "Loading live billing data..." : "جاري تحميل بيانات الفوترة..."}
      </div>
    );
  }

  const outstandingInvoices = invoices.filter(i => ["issued", "sent", "partial", "overdue"].includes(i.status));
  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + parseFloat(i.amount_outstanding), 0);
  const paidTotal = invoices.reduce((s, i) => s + parseFloat(i.amount_paid), 0);
  const unbilledTotal = encounters.filter(e => e.billing_status === "open").reduce((s, e) => s + parseFloat(e.total_charges), 0);

  const filtered = encounters.filter(e => statusFilter === "all" || e.billing_status === statusFilter);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Billing & Charge Capture" : "الفوترة وتسجيل الرسوم"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Live encounter billing and invoices" : "فوترة الزيارات والفواتير المباشرة"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Unbilled (open)" : "غير مُفوتر", value: `SAR ${unbilledTotal.toLocaleString()}`, color: "#ef4444" },
          { label: lang === "en" ? "Outstanding invoices" : "فواتير مستحقة", value: `SAR ${outstandingTotal.toLocaleString()}`, color: "#f59e0b" },
          { label: lang === "en" ? "Collected (paid)" : "محصّل", value: `SAR ${paidTotal.toLocaleString()}`, color: "#22c55e" },
          { label: lang === "en" ? "Invoices" : "الفواتير", value: invoices.length, color: "#22D3EE" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: c.color, marginTop: "0.375rem" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["all", ...STATUS_ORDER, "paid", "partial", "denied", "written_off"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: `1px solid ${statusFilter === s ? "#22D3EE" : "var(--color-border)"}`, background: statusFilter === s ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: statusFilter === s ? "#22D3EE" : "var(--color-text)", fontSize: "0.875rem", cursor: "pointer", fontWeight: statusFilter === s ? 600 : 400, textTransform: "capitalize" }}>
            {s} ({encounters.filter(e => s === "all" || e.billing_status === s).length})
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ background: "rgba(34,211,238,0.05)", borderBottom: "1px solid var(--color-border)" }}>
                {[
                  lang === "en" ? "Patient" : "المريض",
                  lang === "en" ? "Encounter Date" : "تاريخ الزيارة",
                  lang === "en" ? "Type" : "النوع",
                  lang === "en" ? "Primary Diagnosis (ICD-11)" : "التشخيص الأساسي",
                  lang === "en" ? "Total Charges (SAR)" : "إجمالي الرسوم",
                  lang === "en" ? "Balance Due (SAR)" : "الرصيد المستحق",
                  lang === "en" ? "Status" : "الحالة",
                  lang === "en" ? "Action" : "الإجراء",
                ].map(h => (
                  <th key={h} style={{ padding: "0.875rem 0.75rem", textAlign: lang === "ar" ? "right" : "left", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    {lang === "en" ? "No encounter billing records for this filter." : "لا توجد سجلات فوترة لهذا الفلتر."}
                  </td>
                </tr>
              )}
              {filtered.map(enc => {
                const statusIdx = STATUS_ORDER.indexOf(enc.billing_status);
                const nextStatus = statusIdx >= 0 && statusIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[statusIdx + 1] : undefined;
                return (
                  <tr key={enc.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.875rem 0.75rem", fontWeight: 600 }}>
                      {patientNames.get(enc.patient_account) || (lang === "en" ? "Unknown patient" : "مريض غير معروف")}
                    </td>
                    <td style={{ padding: "0.875rem 0.75rem", color: "var(--color-text-muted)" }}>{enc.encounter_date}</td>
                    <td style={{ padding: "0.875rem 0.75rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{enc.encounter_type}</td>
                    <td style={{ padding: "0.875rem 0.75rem", fontFamily: "monospace" }}>{enc.icd11_primary_diagnosis || "—"}</td>
                    <td style={{ padding: "0.875rem 0.75rem", fontWeight: 700 }}>{parseFloat(enc.total_charges).toLocaleString()}</td>
                    <td style={{ padding: "0.875rem 0.75rem" }}>{parseFloat(enc.balance_due).toLocaleString()}</td>
                    <td style={{ padding: "0.875rem 0.75rem" }}>
                      <span style={{ padding: "0.25rem 0.625rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: `${STATUS_COLOR[enc.billing_status]}22`, color: STATUS_COLOR[enc.billing_status], textTransform: "capitalize" }}>
                        {enc.billing_status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 0.75rem" }}>
                      {nextStatus && (
                        <button onClick={() => advanceStatus(enc)} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "none", background: "#22D3EE", color: "#000", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                          {lang === "en" ? `Mark ${nextStatus}` : `تعليم ${nextStatus}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
          {lang === "en" ? `${filtered.length} encounter billing record(s)` : `${filtered.length} سجل فوترة`}
        </div>
      </div>
    </div>
  );
}
