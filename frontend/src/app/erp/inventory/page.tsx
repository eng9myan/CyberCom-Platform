"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Item { id: string; sku: string; name: string; name_ar: string; category: string; qty: number; unit: string; reorder_level: number; expiry?: string; supplier: string; status: "adequate" | "low" | "critical" | "expired"; }
const MOCK: Item[] = [
  { id: "i01", sku: "MED-0001", name: "Surgical Gloves (M)", name_ar: "قفازات جراحية (M)", category: "PPE", qty: 2400, unit: "pairs", reorder_level: 500, supplier: "Al-Nasser Medical", status: "adequate" },
  { id: "i02", sku: "MED-0002", name: "N95 Respirator", name_ar: "كمامة N95", category: "PPE", qty: 180, unit: "units", reorder_level: 200, supplier: "Gulf Medical Supplies", status: "low" },
  { id: "i03", sku: "MED-0003", name: "IV Cannula 18G", name_ar: "كانولا وريدية 18G", category: "Consumables", qty: 1200, unit: "units", reorder_level: 300, supplier: "Becton Dickinson", status: "adequate" },
  { id: "i04", sku: "MED-0004", name: "Syringe 5ml", name_ar: "محقنة 5 مل", category: "Consumables", qty: 50, unit: "units", reorder_level: 500, supplier: "Al-Nasser Medical", status: "critical" },
  { id: "i05", sku: "MED-0005", name: "Sodium Chloride 0.9% 500ml", name_ar: "محلول ملحي 500 مل", category: "IV Fluids", qty: 640, unit: "bags", reorder_level: 200, supplier: "Baxter Healthcare", status: "adequate" },
  { id: "i06", sku: "MED-0006", name: "Betadine Solution 500ml", name_ar: "بيتادين 500 مل", category: "Antiseptics", qty: 95, unit: "bottles", reorder_level: 100, expiry: "2026-09-30", supplier: "Gulf Medical Supplies", status: "low" },
  { id: "i07", sku: "MED-0007", name: "ECG Electrodes (pack 10)", name_ar: "أقطاب ECG", category: "Diagnostics", qty: 320, unit: "packs", reorder_level: 50, supplier: "Philips Healthcare", status: "adequate" },
  { id: "i08", sku: "MED-0008", name: "Morphine 10mg/ml Ampoules", name_ar: "مورفين 10 مجم/مل", category: "Controlled Drugs", qty: 0, unit: "ampoules", reorder_level: 50, expiry: "2025-12-31", supplier: "SPIMACO", status: "expired" },
  { id: "i09", sku: "MED-0009", name: "Sterile Dressing Pack", name_ar: "حزمة ضمادات معقمة", category: "Wound Care", qty: 880, unit: "packs", reorder_level: 200, supplier: "Medline Industries", status: "adequate" },
  { id: "i10", sku: "MED-0010", name: "Blood Collection Tubes (EDTA)", name_ar: "أنابيب سحب دم EDTA", category: "Lab Supplies", qty: 1500, unit: "tubes", reorder_level: 500, supplier: "BD Vacutainer", status: "adequate" },
  { id: "i11", sku: "MED-0011", name: "Oxygen Mask (Adult)", name_ar: "قناع أكسجين (بالغ)", category: "Respiratory", qty: 120, unit: "units", reorder_level: 150, supplier: "Gulf Medical Supplies", status: "low" },
  { id: "i12", sku: "MED-0012", name: "Foley Catheter 16Fr", name_ar: "كاتيتر فولي 16Fr", category: "Urology", qty: 380, unit: "units", reorder_level: 100, supplier: "Bard Medical", status: "adequate" },
  { id: "i13", sku: "MED-0013", name: "Lancets (pack 100)", name_ar: "مشارط الإصبع", category: "Diabetic Care", qty: 15, unit: "packs", reorder_level: 50, supplier: "Accu-Chek", status: "critical" },
  { id: "i14", sku: "MED-0014", name: "Endotracheal Tube 7.5", name_ar: "أنبوب رغامي 7.5", category: "Anesthesia", qty: 200, unit: "units", reorder_level: 30, supplier: "Mallinkrodt", status: "adequate" },
  { id: "i15", sku: "MED-0015", name: "Heparin 5000 IU/ml", name_ar: "هيبارين 5000 وحدة/مل", category: "Medications", qty: 80, unit: "ampoules", reorder_level: 100, expiry: "2027-03-31", supplier: "SPIMACO", status: "low" },
];
const STATUS_COLOR: Record<string, string> = { adequate: "#22c55e", low: "#f59e0b", critical: "#ef4444", expired: "#6b7280" };

export default function InventoryPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [items, setItems] = useState<Item[]>(MOCK);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Item[]>("/api/v1/erp/inventory/items/").then(d => { if (d && d.length) setItems(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => (filter === "all" || i.status === filter) && (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search)));

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "إدارة المخزون الطبي" : "Medical Supply Inventory"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{items.length} {isAr ? "صنف" : "items"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[{ label: isAr ? "الأصناف" : "Total SKUs", value: items.length, color: "#22D3EE" }, { label: isAr ? "مخزون منخفض" : "Low Stock", value: items.filter(i => i.status === "low").length, color: "#f59e0b" }, { label: isAr ? "حرج" : "Critical", value: items.filter(i => i.status === "critical").length, color: "#ef4444" }, { label: isAr ? "منتهي الصلاحية" : "Expired", value: items.filter(i => i.status === "expired").length, color: "#6b7280" }].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search SKU or name..."} style={{ padding: "0.45rem 0.75rem", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", minWidth: 240 }} />
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {["all", "adequate", "low", "critical", "expired"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f}</button>)}
        </div>
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>SKU</th><th style={s.th}>{isAr ? "المنتج" : "Item"}</th><th style={s.th}>{isAr ? "الفئة" : "Category"}</th><th style={s.th}>{isAr ? "الكمية" : "Qty"}</th><th style={s.th}>{isAr ? "حد إعادة الطلب" : "Reorder"}</th><th style={s.th}>{isAr ? "الانتهاء" : "Expiry"}</th><th style={s.th}>{isAr ? "المورد" : "Supplier"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th></tr></thead>
          <tbody>{filtered.map(item => <tr key={item.id} style={{ background: item.status === "critical" ? "rgba(239,68,68,0.04)" : item.status === "expired" ? "rgba(107,114,128,0.06)" : "transparent" }}><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem", color: "#a78bfa" }}>{item.sku}</td><td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? item.name_ar : item.name}</div></td><td style={s.td}>{item.category}</td><td style={{ ...s.td, fontWeight: 700, color: item.qty <= item.reorder_level ? STATUS_COLOR[item.status] : "var(--color-text)" }}>{item.qty} {item.unit}</td><td style={{ ...s.td, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{item.reorder_level} {item.unit}</td><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{item.expiry ?? "—"}</td><td style={s.td}>{item.supplier}</td><td style={s.td}><span style={{ background: `${STATUS_COLOR[item.status]}22`, color: STATUS_COLOR[item.status], border: `1px solid ${STATUS_COLOR[item.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{item.status}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
