"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type BillingStatus = "open" | "coded" | "reviewed" | "billed" | "paid" | "partial" | "denied" | "written_off";
const STATUS_ORDER: BillingStatus[] = ["open", "coded", "reviewed", "billed"];

interface PatientAccount {
  id: string;
  patient_id: string;
}

interface EncounterBilling {
  id: string;
  patient_account: string;
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

export default function HospitalBilling() {
  const { session, isAuthenticated } = useAuth();
  const [encounters, setEncounters] = useState<EncounterBilling[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState<"all" | BillingStatus>("all");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
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
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function advanceStatus(encounter: EncounterBilling) {
    const idx = STATUS_ORDER.indexOf(encounter.billing_status);
    if (idx === -1 || idx === STATUS_ORDER.length - 1 || !session) return;
    try {
      await apiFetch(`/api/v1/rcm/billing/encounter-billings/${encounter.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ billing_status: STATUS_ORDER[idx + 1] }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || "Failed to update billing status.");
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load billing data</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }
  if (encounters === null || invoices === null) {
    return <div className="mt-16 text-center text-white/50">Loading live billing data...</div>;
  }

  const outstandingInvoices = invoices.filter(i => ["issued", "sent", "partial", "overdue"].includes(i.status));
  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + parseFloat(i.amount_outstanding), 0);
  const paidTotal = invoices.reduce((s, i) => s + parseFloat(i.amount_paid), 0);
  const unbilledTotal = encounters.filter(e => e.billing_status === "open").reduce((s, e) => s + parseFloat(e.total_charges), 0);
  const filtered = encounters.filter(e => statusFilter === "all" || e.billing_status === statusFilter);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Receipt size={22} /> Billing & Invoicing</h1>
        <p className="mt-1 text-sm text-white/50">Live encounter billing and invoices for this tenant</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Unbilled (open)", value: `SAR ${unbilledTotal.toLocaleString()}`, color: "#ef4444" },
          { label: "Outstanding invoices", value: `SAR ${outstandingTotal.toLocaleString()}`, color: "#f59e0b" },
          { label: "Collected (paid)", value: `SAR ${paidTotal.toLocaleString()}`, color: "#22c55e" },
          { label: "Invoices", value: invoices.length, color: "#22D3EE" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-surface-raised p-4">
            <p className="text-xs text-white/50">{c.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...STATUS_ORDER, "paid", "partial", "denied", "written_off"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${statusFilter === s ? "border-brand-400 bg-brand-500/15 text-brand-200 font-semibold" : "border-white/10 bg-surface-overlay text-white/70"}`}
          >
            {s} ({encounters.filter(e => s === "all" || e.billing_status === s).length})
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Patient", "Date", "Type", "Diagnosis (ICD-11)", "Charges (SAR)", "Balance Due", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-white/50">No encounter billing records for this filter.</td></tr>
              )}
              {filtered.map(enc => {
                const statusIdx = STATUS_ORDER.indexOf(enc.billing_status);
                const nextStatus = statusIdx >= 0 && statusIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[statusIdx + 1] : undefined;
                return (
                  <tr key={enc.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium">{patientNames.get(enc.patient_account) || "Unknown patient"}</td>
                    <td className="px-4 py-3 text-white/60">{enc.encounter_date}</td>
                    <td className="px-4 py-3 capitalize text-white/60">{enc.encounter_type}</td>
                    <td className="px-4 py-3 font-mono">{enc.icd11_primary_diagnosis || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{parseFloat(enc.total_charges).toLocaleString()}</td>
                    <td className="px-4 py-3">{parseFloat(enc.balance_due).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ background: `${STATUS_COLOR[enc.billing_status]}22`, color: STATUS_COLOR[enc.billing_status] }}>
                        {enc.billing_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {nextStatus && (
                        <button onClick={() => advanceStatus(enc)} className="rounded-md bg-brand-500 px-2 py-1 text-xs font-semibold capitalize hover:bg-brand-600">
                          Mark {nextStatus}
                        </button>
                      )}
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
