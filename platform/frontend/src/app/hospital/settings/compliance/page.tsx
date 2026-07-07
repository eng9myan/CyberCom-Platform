"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Landmark, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ComplianceSettings {
  id: string;
  jofotara_enabled: boolean;
  jofotara_tax_registration_number: string;
  jofotara_activity_code: string;
  jofotara_client_secret_set: boolean;
  zatca_enabled: boolean;
  zatca_csid_set: boolean;
  zatca_production_csid_set: boolean;
  zatca_onboarding_otp_set: boolean;
  updated_at: string;
}

interface SettingsForm {
  jofotara_enabled: boolean;
  jofotara_tax_registration_number: string;
  jofotara_activity_code: string;
  jofotara_client_secret: string;
  zatca_enabled: boolean;
  zatca_csid: string;
  zatca_production_csid: string;
  zatca_onboarding_otp: string;
}

const emptyForm: SettingsForm = {
  jofotara_enabled: false,
  jofotara_tax_registration_number: "",
  jofotara_activity_code: "",
  jofotara_client_secret: "",
  zatca_enabled: false,
  zatca_csid: "",
  zatca_production_csid: "",
  zatca_onboarding_otp: "",
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-ink/15"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export default function ComplianceSettingsPage() {
  const { session, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<ComplianceSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const data = await apiFetch<ComplianceSettings>("/api/v1/commercial/compliance-settings/", {
        token: session.accessToken,
        tenantId: session.tenantId,
      });
      setSettings(data);
      setForm({
        jofotara_enabled: data.jofotara_enabled,
        jofotara_tax_registration_number: data.jofotara_tax_registration_number,
        jofotara_activity_code: data.jofotara_activity_code,
        jofotara_client_secret: "",
        zatca_enabled: data.zatca_enabled,
        zatca_csid: "",
        zatca_production_csid: "",
        zatca_onboarding_otp: "",
      });
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load compliance settings."));
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    setSaveMsg(null);
    try {
      const updated = await apiFetch<ComplianceSettings>("/api/v1/commercial/compliance-settings/", {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify(form),
      });
      setSettings(updated);
      setForm(f => ({ ...f, jofotara_client_secret: "", zatca_csid: "", zatca_production_csid: "", zatca_onboarding_otp: "" }));
      setSaveMsg("Compliance settings saved.");
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setSaveError(detail || (err instanceof Error ? err.message : "Failed to save compliance settings."));
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load compliance settings</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (settings === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading compliance settings...</div>;
  }

  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck size={22} className="text-brand-400" /> Regional Compliance &amp; Tax Configurations
        </h1>
        <p className="mt-1 text-sm text-ink/50">
          Jordan JoFotara and KSA ZATCA Phase 2 e-invoicing credentials for this tenant.
        </p>
      </header>

      {saveMsg && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">{saveMsg}</div>}
      {saveError && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400">{saveError}</div>}

      <div className="cy-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Landmark size={17} className="text-sky-400" /> Enable Jordan JoFotara Compliance
            </h2>
            <p className="mt-1 text-sm text-ink/50">
              Submits invoices to the Jordanian ISTD e-invoicing system for this tenant.
            </p>
          </div>
          <Toggle
            checked={form.jofotara_enabled}
            onChange={v => setForm(f => ({ ...f, jofotara_enabled: v }))}
            label="Enable Jordan JoFotara Compliance"
          />
        </div>

        {form.jofotara_enabled && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Tax Registration Number</label>
              <input
                value={form.jofotara_tax_registration_number}
                onChange={e => setForm(f => ({ ...f, jofotara_tax_registration_number: e.target.value }))}
                placeholder="e.g. 123456789"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Activity Code</label>
              <input
                value={form.jofotara_activity_code}
                onChange={e => setForm(f => ({ ...f, jofotara_activity_code: e.target.value }))}
                placeholder="ISTD activity code"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Client Secret{settings.jofotara_client_secret_set && <span className="ml-2 font-normal text-emerald-400">(currently set)</span>}
              </label>
              <input
                type="password"
                value={form.jofotara_client_secret}
                onChange={e => setForm(f => ({ ...f, jofotara_client_secret: e.target.value }))}
                placeholder={settings.jofotara_client_secret_set ? "•••••••••••• (leave blank to keep)" : "Enter client secret"}
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      <div className="cy-card mt-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Landmark size={17} className="text-amber-400" /> Enable KSA ZATCA Phase 2 Compliance
            </h2>
            <p className="mt-1 text-sm text-ink/50">
              Submits invoices to the Saudi ZATCA e-invoicing platform for this tenant.
            </p>
          </div>
          <Toggle
            checked={form.zatca_enabled}
            onChange={v => setForm(f => ({ ...f, zatca_enabled: v }))}
            label="Enable KSA ZATCA Phase 2 Compliance"
          />
        </div>

        {form.zatca_enabled && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Cryptographic Stamp Identifier (CSID){settings.zatca_csid_set && <span className="ml-2 font-normal text-emerald-400">(set)</span>}
              </label>
              <input
                type="password"
                value={form.zatca_csid}
                onChange={e => setForm(f => ({ ...f, zatca_csid: e.target.value }))}
                placeholder={settings.zatca_csid_set ? "•••••••••••• (leave blank to keep)" : "Compliance CSID"}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Production CSID{settings.zatca_production_csid_set && <span className="ml-2 font-normal text-emerald-400">(set)</span>}
              </label>
              <input
                type="password"
                value={form.zatca_production_csid}
                onChange={e => setForm(f => ({ ...f, zatca_production_csid: e.target.value }))}
                placeholder={settings.zatca_production_csid_set ? "•••••••••••• (leave blank to keep)" : "Production CSID"}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Portal Onboarding OTP{settings.zatca_onboarding_otp_set && <span className="ml-2 font-normal text-emerald-400">(set)</span>}
              </label>
              <input
                type="password"
                value={form.zatca_onboarding_otp}
                onChange={e => setForm(f => ({ ...f, zatca_onboarding_otp: e.target.value }))}
                placeholder="One-time code from the ZATCA portal"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-ink/40">
                Single-use for CSID onboarding — cleared automatically once onboarding succeeds.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={() => { void save(); }} disabled={saving} className="cy-btn cy-btn-primary disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving..." : "Save Compliance Settings"}
        </button>
      </div>
    </div>
  );
}
