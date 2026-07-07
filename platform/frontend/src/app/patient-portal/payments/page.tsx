"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Invoice { id: string; date: string; service: string; service_ar: string; total: number; insurance_paid: number; patient_due: number; status: "outstanding" | "paid" | "partial"; }
const MOCK: Invoice[] = [
  { id: "inv-001", date: "2026-06-20", service: "Internal Medicine Consultation", service_ar: "استشارة طب باطني", total: 450, insurance_paid: 360, patient_due: 90, status: "outstanding" },
  { id: "inv-002", date: "2026-06-20", service: "Lab Panel (CBC + CMP + HbA1c)", service_ar: "فحوصات مخبرية", total: 320, insurance_paid: 256, patient_due: 64, status: "outstanding" },
  { id: "inv-003", date: "2026-06-20", service: "Chest X-Ray", service_ar: "صورة صدر", total: 180, insurance_paid: 144, patient_due: 36, status: "outstanding" },
  { id: "inv-004", date: "2026-05-15", service: "Cardiology Consultation", service_ar: "استشارة قلب", total: 600, insurance_paid: 480, patient_due: 120, status: "paid" },
  { id: "inv-005", date: "2026-05-15", service: "Echocardiogram", service_ar: "تخطيط صدى القلب", total: 850, insurance_paid: 680, patient_due: 170, status: "paid" },
  { id: "inv-006", date: "2026-04-01", service: "Orthopedics Consultation", service_ar: "استشارة عظام", total: 500, insurance_paid: 400, patient_due: 100, status: "paid" },
  { id: "inv-007", date: "2026-04-01", service: "Knee MRI", service_ar: "MRI للركبة", total: 1200, insurance_paid: 960, patient_due: 240, status: "paid" },
  { id: "inv-008", date: "2026-02-18", service: "Annual Physical Examination", service_ar: "الفحص الدوري السنوي", total: 380, insurance_paid: 380, patient_due: 0, status: "paid" },
];
const STATUS_COLOR: Record<string, string> = { outstanding: "#f59e0b", paid: "#22c55e", partial: "#22D3EE" };

export default function PatientPaymentsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK);
  const [payMethod, setPayMethod] = useState<"card" | "bank" | "insurance">("card");
  const [showPayForm, setShowPayForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Invoice[]>("/api/v1/patient-portal/payments/invoices/").then(d => { if (d && d.length) setInvoices(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const outstanding = invoices.filter(i => i.status === "outstanding");
  const paid = invoices.filter(i => i.status === "paid");
  const totalDue = outstanding.reduce((a, i) => a + i.patient_due, 0);

  const handlePay = async (id: string) => {
    try { await apiFetch(`/api/v1/patient-portal/payments/invoices/${id}/pay/`, { method: "POST", body: JSON.stringify({ method: payMethod }) }); } catch {}
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" as const } : i));
    setShowPayForm(null);
  };

  const InvRow = ({ inv }: { inv: Invoice }) => (
    <div className="cy-card mb-3 p-0" style={{ borderLeft: `4px solid ${STATUS_COLOR[inv.status]}` }}>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1">
            <div className="font-semibold">{isAr ? inv.service_ar : inv.service}</div>
            <div className="text-[13px] text-ink/50">{inv.date}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink/50">{isAr ? "المجموع" : "Total"}: SAR {inv.total}</div>
            <div className="text-xs text-ink/50">{isAr ? "التأمين" : "Insurance"}: SAR {inv.insurance_paid}</div>
            <div className="font-bold" style={{ color: STATUS_COLOR[inv.status] }}>{isAr ? "المستحق" : "Due"}: SAR {inv.patient_due}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[inv.status]}22`, color: STATUS_COLOR[inv.status], border: `1px solid ${STATUS_COLOR[inv.status]}55` }}>{inv.status}</span>
          {inv.status === "outstanding" && (
            <button onClick={() => setShowPayForm(showPayForm === inv.id ? null : inv.id)} className="rounded-lg bg-emerald-500/15 px-4 py-1.5 text-[13px] font-semibold text-emerald-400 hover:bg-emerald-500/25">{isAr ? "دفع الآن" : "Pay Now"}</button>
          )}
        </div>
        {showPayForm === inv.id && (
          <div className="mt-3 rounded-lg border border-ink/10 bg-surface-overlay p-4">
            <div className="mb-2 text-sm font-semibold">{isAr ? "طريقة الدفع" : "Payment Method"}</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(["card", "bank", "insurance"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`rounded px-3 py-1.5 text-sm font-semibold ${payMethod === m ? "border border-brand-400 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink"}`}
                >
                  {m === "card" ? (isAr ? "بطاقة" : "Card") : m === "bank" ? (isAr ? "تحويل" : "Bank") : (isAr ? "تأمين" : "Insurance")}
                </button>
              ))}
            </div>
            <div className="mb-3 text-xs text-ink/50">
              {isAr ? "ملاحظة: هذه واجهة تجريبية. لا تتم معالجة مدفوعات حقيقية." : "Note: This is a demo interface. No real payment processing occurs."}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePay(inv.id)} className="cy-btn bg-emerald-500 text-white">{isAr ? `تأكيد الدفع — SAR ${inv.patient_due}` : `Confirm — SAR ${inv.patient_due}`}</button>
              <button onClick={() => setShowPayForm(null)} className="cy-btn cy-btn-ghost">{isAr ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "المدفوعات والفواتير" : "Payments & Billing"}</h1>
          <p className="text-sm text-ink/50">{isAr ? "سجل فواتيرك ومدفوعاتك" : "Your invoice history and payment portal"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/patient-portal" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← البوابة" : "← Portal"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: isAr ? "إجمالي المستحق" : "Total Outstanding", value: `SAR ${totalDue}`, color: "#f59e0b" },
          { label: isAr ? "فواتير غير مدفوعة" : "Unpaid Invoices", value: outstanding.length, color: "#ef4444" },
          { label: isAr ? "فواتير مدفوعة" : "Paid Invoices", value: paid.length, color: "#22c55e" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-sm text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <div className="mb-3 text-lg font-bold">{isAr ? "فواتير غير مدفوعة" : "Outstanding Invoices"}</div>
        {outstanding.length === 0 ? <div className="py-8 text-center text-ink/50">{isAr ? "لا توجد فواتير مستحقة" : "No outstanding invoices"}</div> : outstanding.map(i => <InvRow key={i.id} inv={i} />)}
      </div>
      <div>
        <div className="mb-3 text-lg font-bold">{isAr ? "الفواتير المدفوعة" : "Paid Invoices"}</div>
        {paid.map(i => <InvRow key={i.id} inv={i} />)}
      </div>
    </div>
  );
}
