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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 900, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    sectionTitle: { fontSize: "1rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.75rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "0.75rem" },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" },
  };

  const InvRow = ({ inv }: { inv: Invoice }) => (
    <div style={{ ...s.card, borderLeft: `4px solid ${STATUS_COLOR[inv.status]}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{isAr ? inv.service_ar : inv.service}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{inv.date}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{isAr ? "المجموع" : "Total"}: SAR {inv.total}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{isAr ? "التأمين" : "Insurance"}: SAR {inv.insurance_paid}</div>
          <div style={{ fontWeight: 700, color: STATUS_COLOR[inv.status] }}>{isAr ? "المستحق" : "Due"}: SAR {inv.patient_due}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
        <span style={{ background: `${STATUS_COLOR[inv.status]}22`, color: STATUS_COLOR[inv.status], border: `1px solid ${STATUS_COLOR[inv.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{inv.status}</span>
        {inv.status === "outstanding" && (
          <button onClick={() => setShowPayForm(showPayForm === inv.id ? null : inv.id)} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 6, padding: "0.35rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>{isAr ? "دفع الآن" : "Pay Now"}</button>
        )}
      </div>
      {showPayForm === inv.id && (
        <div style={{ marginTop: "0.75rem", padding: "1rem", background: "var(--color-background)", borderRadius: 6, border: "1px solid var(--color-border)" }}>
          <div style={{ marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>{isAr ? "طريقة الدفع" : "Payment Method"}</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {(["card", "bank", "insurance"] as const).map(m => <button key={m} onClick={() => setPayMethod(m)} style={{ padding: "0.35rem 0.75rem", borderRadius: 5, border: `1px solid ${payMethod === m ? "#22D3EE" : "var(--color-border)"}`, background: payMethod === m ? "#22D3EE22" : "transparent", color: payMethod === m ? "#22D3EE" : "var(--color-text)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>{m === "card" ? (isAr ? "بطاقة" : "Card") : m === "bank" ? (isAr ? "تحويل" : "Bank") : (isAr ? "تأمين" : "Insurance")}</button>)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
            {isAr ? "ملاحظة: هذه واجهة تجريبية. لا تتم معالجة مدفوعات حقيقية." : "Note: This is a demo interface. No real payment processing occurs."}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => handlePay(inv.id)} style={{ background: "#22c55e", color: "#000", border: "none", borderRadius: 6, padding: "0.4rem 1.25rem", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>{isAr ? `تأكيد الدفع — SAR ${inv.patient_due}` : `Confirm — SAR ${inv.patient_due}`}</button>
            <button onClick={() => setShowPayForm(null)} style={{ background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "0.4rem 0.75rem", cursor: "pointer" }}>{isAr ? "إلغاء" : "Cancel"}</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "المدفوعات والفواتير" : "Payments & Billing"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "سجل فواتيرك ومدفوعاتك" : "Your invoice history and payment portal"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/patient-portal" style={s.btn}>{isAr ? "← البوابة" : "← Portal"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.summaryGrid}>
        {[
          { label: isAr ? "إجمالي المستحق" : "Total Outstanding", value: `SAR ${totalDue}`, color: "#f59e0b" },
          { label: isAr ? "فواتير غير مدفوعة" : "Unpaid Invoices", value: outstanding.length, color: "#ef4444" },
          { label: isAr ? "فواتير مدفوعة" : "Paid Invoices", value: paid.length, color: "#22c55e" },
        ].map(m => (
          <div key={m.label} style={{ ...s.card, textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={s.sectionTitle}>{isAr ? "فواتير غير مدفوعة" : "Outstanding Invoices"}</div>
        {outstanding.length === 0 ? <div style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "2rem" }}>{isAr ? "لا توجد فواتير مستحقة" : "No outstanding invoices"}</div> : outstanding.map(i => <InvRow key={i.id} inv={i} />)}
      </div>
      <div>
        <div style={s.sectionTitle}>{isAr ? "الفواتير المدفوعة" : "Paid Invoices"}</div>
        {paid.map(i => <InvRow key={i.id} inv={i} />)}
      </div>
    </div>
  );
}
