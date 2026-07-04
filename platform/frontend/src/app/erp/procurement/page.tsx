"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PO { id: string; po_number: string; vendor: string; vendor_ar: string; items_count: number; total: number; currency: string; ordered_on: string; expected_delivery: string; status: "draft" | "approved" | "ordered" | "partial" | "received" | "cancelled"; category: string; }
const MOCK: PO[] = [
  { id: "po01", po_number: "PO-2026-0801", vendor: "Al-Nasser Medical", vendor_ar: "الناصر الطبية", items_count: 12, total: 45000, currency: "SAR", ordered_on: "2026-06-28", expected_delivery: "2026-07-05", status: "ordered", category: "Medical Supplies" },
  { id: "po02", po_number: "PO-2026-0802", vendor: "Baxter Healthcare", vendor_ar: "باكستر", items_count: 3, total: 28000, currency: "SAR", ordered_on: "2026-06-25", expected_delivery: "2026-07-03", status: "received", category: "IV Fluids" },
  { id: "po03", po_number: "PO-2026-0803", vendor: "Becton Dickinson", vendor_ar: "بيكتون ديكنسون", items_count: 8, total: 62000, currency: "SAR", ordered_on: "2026-06-30", expected_delivery: "2026-07-10", status: "approved", category: "Lab Supplies" },
  { id: "po04", po_number: "PO-2026-0804", vendor: "SPIMACO", vendor_ar: "سبيماكو", items_count: 20, total: 120000, currency: "SAR", ordered_on: "2026-06-20", expected_delivery: "2026-07-01", status: "partial", category: "Medications" },
  { id: "po05", po_number: "PO-2026-0805", vendor: "Gulf Medical Supplies", vendor_ar: "المستلزمات الطبية الخليجية", items_count: 6, total: 18500, currency: "SAR", ordered_on: "2026-07-01", expected_delivery: "2026-07-08", status: "draft", category: "PPE" },
  { id: "po06", po_number: "PO-2026-0806", vendor: "Philips Healthcare", vendor_ar: "فيليبس الرعاية الصحية", items_count: 2, total: 350000, currency: "SAR", ordered_on: "2026-06-15", expected_delivery: "2026-08-01", status: "ordered", category: "Medical Equipment" },
  { id: "po07", po_number: "PO-2026-0807", vendor: "Medline Industries", vendor_ar: "ميدلاين", items_count: 15, total: 33000, currency: "SAR", ordered_on: "2026-06-22", expected_delivery: "2026-07-06", status: "received", category: "Wound Care" },
  { id: "po08", po_number: "PO-2026-0808", vendor: "Accu-Chek", vendor_ar: "أكيو-تشيك", items_count: 4, total: 9800, currency: "SAR", ordered_on: "2026-07-01", expected_delivery: "2026-07-07", status: "approved", category: "Diabetic Care" },
  { id: "po09", po_number: "PO-2026-0809", vendor: "Al-Nasser Medical", vendor_ar: "الناصر الطبية", items_count: 30, total: 56000, currency: "SAR", ordered_on: "2026-06-10", expected_delivery: "2026-06-20", status: "received", category: "Consumables" },
  { id: "po10", po_number: "PO-2026-0810", vendor: "Bard Medical", vendor_ar: "بارد ميديكال", items_count: 5, total: 14000, currency: "SAR", ordered_on: "2026-07-01", expected_delivery: "2026-07-09", status: "draft", category: "Urology" },
  { id: "po11", po_number: "PO-2026-0811", vendor: "Mallinkrodt", vendor_ar: "مالينكروت", items_count: 3, total: 22000, currency: "SAR", ordered_on: "2026-06-28", expected_delivery: "2026-07-15", status: "ordered", category: "Anesthesia" },
  { id: "po12", po_number: "PO-2026-0812", vendor: "BD Vacutainer", vendor_ar: "بي دي فاكيوتاينر", items_count: 10, total: 7500, currency: "SAR", ordered_on: "2026-06-05", expected_delivery: "2026-06-12", status: "received", category: "Lab Supplies" },
  { id: "po13", po_number: "PO-2026-0813", vendor: "Gulf Medical Supplies", vendor_ar: "المستلزمات الطبية الخليجية", items_count: 7, total: 25000, currency: "SAR", ordered_on: "2026-05-20", expected_delivery: "2026-06-01", status: "cancelled", category: "PPE" },
];
const STATUS_COLOR: Record<string, string> = { draft: "#6b7280", approved: "#22D3EE", ordered: "#f59e0b", partial: "#a78bfa", received: "#22c55e", cancelled: "#ef4444" };

export default function ProcurementPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [orders, setOrders] = useState<PO[]>(MOCK);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<PO[]>("/api/v1/erp/procurement/purchase-orders/").then(d => { if (d && d.length) setOrders(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    try { await apiFetch(`/api/v1/erp/procurement/purchase-orders/${id}/approve/`, { method: "POST" }); } catch {}
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "approved" as const } : o));
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalSpend = orders.filter(o => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "أوامر الشراء" : "Purchase Orders"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{orders.length} {isAr ? "أمر شراء" : "POs"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[
          { label: isAr ? "إجمالي الإنفاق" : "Total Spend", value: `SAR ${fmt(totalSpend)}`, color: "#22D3EE" },
          { label: isAr ? "قيد المعالجة" : "Open POs", value: orders.filter(o => ["draft","approved","ordered","partial"].includes(o.status)).length, color: "#f59e0b" },
          { label: isAr ? "بانتظار الموافقة" : "Awaiting Approval", value: orders.filter(o => o.status === "draft").length, color: "#ef4444" },
          { label: isAr ? "مستلمة" : "Received", value: orders.filter(o => o.status === "received").length, color: "#22c55e" },
        ].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "draft", "approved", "ordered", "partial", "received", "cancelled"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f}</button>)}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "رقم الأمر" : "PO #"}</th><th style={s.th}>{isAr ? "المورد" : "Vendor"}</th><th style={s.th}>{isAr ? "الفئة" : "Category"}</th><th style={s.th}>{isAr ? "الأصناف" : "Items"}</th><th style={s.th}>{isAr ? "الإجمالي" : "Total"}</th><th style={s.th}>{isAr ? "التاريخ" : "Ordered"}</th><th style={s.th}>{isAr ? "التسليم" : "Delivery"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
          <tbody>{filtered.map(o => <tr key={o.id}><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.po_number}</td><td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? o.vendor_ar : o.vendor}</div></td><td style={s.td}>{o.category}</td><td style={s.td}>{o.items_count}</td><td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700 }}>SAR {o.total.toLocaleString()}</td><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.ordered_on}</td><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.expected_delivery}</td><td style={s.td}><span style={{ background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{o.status}</span></td><td style={s.td}>{o.status === "draft" && <button onClick={() => handleApprove(o.id)} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{isAr ? "موافقة" : "Approve"}</button>}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
