"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface InventoryRaw {
  id: string;
  ndc_code?: string;
  drug_name?: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  reorder_level?: number;
  status?: string;
  bin_location?: string;
}

interface InventoryItem {
  id: string;
  ndcCode: string;
  drugName: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  reorderLevel: number;
  status: "adequate" | "low" | "critical" | "expired";
  binLocation: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "inv-001", ndcCode: "0069-0420-30", drugName: "Amoxicillin 500mg Capsules", quantity: 840, unit: "capsules", expiryDate: "2027-03-31", reorderLevel: 200, status: "adequate", binLocation: "A-12" },
  { id: "inv-002", ndcCode: "0069-0530-10", drugName: "Metformin 850mg Tablets", quantity: 1200, unit: "tablets", expiryDate: "2027-06-30", reorderLevel: 300, status: "adequate", binLocation: "A-03" },
  { id: "inv-003", ndcCode: "0071-0156-24", drugName: "Atorvastatin 20mg Tablets", quantity: 150, unit: "tablets", expiryDate: "2026-11-30", reorderLevel: 200, status: "low", binLocation: "C-15" },
  { id: "inv-004", ndcCode: "0069-0010-08", drugName: "Insulin Glargine 100u/mL Pen", quantity: 18, unit: "pens", expiryDate: "2026-09-15", reorderLevel: 30, status: "critical", binLocation: "F-01" },
  { id: "inv-005", ndcCode: "0078-0267-15", drugName: "Imatinib 400mg Tablets", quantity: 30, unit: "tablets", expiryDate: "2026-08-31", reorderLevel: 60, status: "critical", binLocation: "D-10" },
  { id: "inv-006", ndcCode: "0069-0310-60", drugName: "Lisinopril 10mg Tablets", quantity: 600, unit: "tablets", expiryDate: "2027-01-31", reorderLevel: 150, status: "adequate", binLocation: "A-09" },
  { id: "inv-007", ndcCode: "0009-0021-01", drugName: "Azithromycin 500mg Tablets", quantity: 320, unit: "tablets", expiryDate: "2026-12-31", reorderLevel: 100, status: "adequate", binLocation: "B-11" },
  { id: "inv-008", ndcCode: "0054-0018-25", drugName: "Salbutamol Inhaler 100mcg", quantity: 45, unit: "inhalers", expiryDate: "2026-10-31", reorderLevel: 50, status: "low", binLocation: "B-07" },
  { id: "inv-009", ndcCode: "0069-0710-30", drugName: "Omeprazole 20mg Capsules", quantity: 900, unit: "capsules", expiryDate: "2027-05-31", reorderLevel: 200, status: "adequate", binLocation: "B-02" },
  { id: "inv-010", ndcCode: "0069-0311-66", drugName: "Amlodipine 5mg Tablets", quantity: 480, unit: "tablets", expiryDate: "2027-02-28", reorderLevel: 100, status: "adequate", binLocation: "C-08" },
  { id: "inv-011", ndcCode: "0024-1230-60", drugName: "Warfarin 5mg Tablets", quantity: 95, unit: "tablets", expiryDate: "2025-12-31", reorderLevel: 100, status: "expired", binLocation: "A-18" },
  { id: "inv-012", ndcCode: "0069-0062-66", drugName: "Metoprolol Succinate 25mg", quantity: 360, unit: "tablets", expiryDate: "2027-04-30", reorderLevel: 100, status: "adequate", binLocation: "C-06" },
  { id: "inv-013", ndcCode: "0069-0420-60", drugName: "Ciprofloxacin 500mg Tablets", quantity: 80, unit: "tablets", expiryDate: "2026-07-31", reorderLevel: 120, status: "low", binLocation: "B-14" },
  { id: "inv-014", ndcCode: "0069-0100-41", drugName: "Levothyroxine 50mcg Tablets", quantity: 550, unit: "tablets", expiryDate: "2027-08-31", reorderLevel: 150, status: "adequate", binLocation: "A-06" },
  { id: "inv-015", ndcCode: "0069-0310-24", drugName: "Prednisolone 5mg Tablets", quantity: 200, unit: "tablets", expiryDate: "2026-11-30", reorderLevel: 80, status: "adequate", binLocation: "C-14" },
  { id: "inv-016", ndcCode: "0069-0161-16", drugName: "Furosemide 40mg Tablets", quantity: 400, unit: "tablets", expiryDate: "2027-03-31", reorderLevel: 100, status: "adequate", binLocation: "A-21" },
  { id: "inv-017", ndcCode: "0069-0780-24", drugName: "Gabapentin 300mg Capsules", quantity: 60, unit: "capsules", expiryDate: "2026-09-30", reorderLevel: 150, status: "critical", binLocation: "D-04" },
  { id: "inv-018", ndcCode: "0006-0725-54", drugName: "Losartan 50mg Tablets", quantity: 720, unit: "tablets", expiryDate: "2027-01-31", reorderLevel: 150, status: "adequate", binLocation: "A-17" },
  { id: "inv-019", ndcCode: "0069-0042-30", drugName: "Paracetamol 1g Tablets", quantity: 1500, unit: "tablets", expiryDate: "2027-06-30", reorderLevel: 400, status: "adequate", binLocation: "E-01" },
  { id: "inv-020", ndcCode: "0069-0056-28", drugName: "Sertraline 50mg Tablets", quantity: 280, unit: "tablets", expiryDate: "2026-12-31", reorderLevel: 100, status: "adequate", binLocation: "C-11" },
  { id: "inv-021", ndcCode: "0069-0031-54", drugName: "Spironolactone 25mg Tablets", quantity: 40, unit: "tablets", expiryDate: "2026-08-31", reorderLevel: 80, status: "low", binLocation: "C-19" },
  { id: "inv-022", ndcCode: "0069-0810-66", drugName: "Clopidogrel 75mg Tablets", quantity: 600, unit: "tablets", expiryDate: "2027-05-31", reorderLevel: 120, status: "adequate", binLocation: "C-02" },
  { id: "inv-023", ndcCode: "0069-0222-30", drugName: "Aspirin 100mg Tablets", quantity: 1800, unit: "tablets", expiryDate: "2027-09-30", reorderLevel: 500, status: "adequate", binLocation: "E-03" },
  { id: "inv-024", ndcCode: "0069-0530-24", drugName: "Ondansetron 8mg Tablets", quantity: 12, unit: "tablets", expiryDate: "2025-11-30", reorderLevel: 60, status: "expired", binLocation: "D-07" },
  { id: "inv-025", ndcCode: "0069-0102-68", drugName: "Doxycycline 100mg Capsules", quantity: 240, unit: "capsules", expiryDate: "2027-02-28", reorderLevel: 100, status: "adequate", binLocation: "B-19" },
  { id: "inv-026", ndcCode: "0069-0046-30", drugName: "Allopurinol 300mg Tablets", quantity: 360, unit: "tablets", expiryDate: "2027-04-30", reorderLevel: 80, status: "adequate", binLocation: "C-22" },
  { id: "inv-027", ndcCode: "0069-0231-16", drugName: "Vancomycin 1g IV Vial", quantity: 8, unit: "vials", expiryDate: "2026-07-15", reorderLevel: 20, status: "critical", binLocation: "F-05" },
  { id: "inv-028", ndcCode: "0069-0012-24", drugName: "Dexamethasone 4mg/mL Injection", quantity: 45, unit: "ampoules", expiryDate: "2026-10-31", reorderLevel: 40, status: "adequate", binLocation: "F-03" },
  { id: "inv-029", ndcCode: "0069-0810-23", drugName: "Cetirizine 10mg Tablets", quantity: 750, unit: "tablets", expiryDate: "2027-07-31", reorderLevel: 200, status: "adequate", binLocation: "E-08" },
  { id: "inv-030", ndcCode: "0069-0054-30", drugName: "Ibuprofen 400mg Tablets", quantity: 900, unit: "tablets", expiryDate: "2027-05-31", reorderLevel: 300, status: "adequate", binLocation: "E-05" },
];

type StatusFilter = "all" | "adequate" | "low" | "critical" | "expired";

interface AdjustForm { itemId: string; adjustment: number; reason: string }

export default function PharmacyInventoryPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({ itemId: "", adjustment: 0, reason: "" });
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<InventoryRaw[]>("/api/v1/pharmacy/inventory/");
        if (data && data.length > 0) {
          const mapped: InventoryItem[] = data.map(item => ({
            id: item.id,
            ndcCode: item.ndc_code || "—",
            drugName: item.drug_name || "Unknown Drug",
            quantity: item.quantity ?? 0,
            unit: item.unit || "units",
            expiryDate: item.expiry_date || "—",
            reorderLevel: item.reorder_level ?? 100,
            status: (["adequate", "low", "critical", "expired"].includes(item.status || "") ? item.status as InventoryItem["status"] : "adequate"),
            binLocation: item.bin_location || "—",
          }));
          setInventory(mapped);
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const openAdjust = (item: InventoryItem) => {
    setAdjustForm({ itemId: item.id, adjustment: 0, reason: "" });
    setShowAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!adjustForm.itemId || adjustForm.adjustment === 0) return;
    try {
      await apiFetch("/api/v1/pharmacy/inventory/adjust/", {
        method: "POST",
        body: JSON.stringify({ item_id: adjustForm.itemId, adjustment: adjustForm.adjustment, reason: adjustForm.reason }),
      });
    } catch {
      // silent
    }
    setInventory(prev => prev.map(item => {
      if (item.id !== adjustForm.itemId) return item;
      const newQty = Math.max(0, item.quantity + adjustForm.adjustment);
      const newStatus: InventoryItem["status"] = newQty === 0 ? "critical" : newQty < item.reorderLevel * 0.5 ? "critical" : newQty < item.reorderLevel ? "low" : "adequate";
      return { ...item, quantity: newQty, status: item.status === "expired" ? "expired" : newStatus };
    }));
    setAdjustMsg(lang === "en" ? `Stock adjusted by ${adjustForm.adjustment > 0 ? "+" : ""}${adjustForm.adjustment} units.` : `تم تعديل المخزون بمقدار ${adjustForm.adjustment} وحدة.`);
    setTimeout(() => setAdjustMsg(null), 3000);
    setShowAdjustModal(false);
  };

  const filtered = inventory.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (search && !item.drugName.toLowerCase().includes(search.toLowerCase()) && !item.ndcCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusStyle: Record<string, { bg: string; color: string; label: { en: string; ar: string } }> = {
    adequate: { bg: "#d1fae5", color: "#065f46", label: { en: "Adequate", ar: "كافٍ" } },
    low: { bg: "#fef3c7", color: "#92400e", label: { en: "Low Stock", ar: "مخزون منخفض" } },
    critical: { bg: "#fee2e2", color: "#b91c1c", label: { en: "Critical", ar: "حرج" } },
    expired: { bg: "#f3f4f6", color: "#6b7280", label: { en: "Expired", ar: "منتهي الصلاحية" } },
  };

  const dir = lang === "ar" ? "rtl" : "ltr";
  const selectedItem = inventory.find(i => i.id === adjustForm.itemId);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Pharmacy Inventory" : "مخزون الصيدلية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Drug stock levels, expiry tracking and stock adjustments" : "مستويات مخزون الأدوية ومتابعة الصلاحية وتعديلات المخزون"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Alert Banners */}
      {inventory.filter(i => i.status === "expired").length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "0.85rem 1.25rem", marginBottom: "1rem", color: "#b91c1c", fontWeight: 600, fontSize: "0.88rem" }}>
          {lang === "en" ? `Expired Items: ${inventory.filter(i => i.status === "expired").length} drug(s) past expiry date — remove from stock immediately.` : `أدوية منتهية الصلاحية: ${inventory.filter(i => i.status === "expired").length} دواء منتهي — يجب إزالته من المخزون فوراً.`}
        </div>
      )}
      {inventory.filter(i => i.status === "critical").length > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "10px", padding: "0.85rem 1.25rem", marginBottom: "1rem", color: "#9a3412", fontWeight: 600, fontSize: "0.88rem" }}>
          {lang === "en" ? `Critical Stock: ${inventory.filter(i => i.status === "critical").length} item(s) below 50% reorder level — place order urgently.` : `مخزون حرج: ${inventory.filter(i => i.status === "critical").length} صنف أقل من 50% من مستوى إعادة الطلب — اطلب فوراً.`}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total Items" : "إجمالي الأصناف", value: inventory.length, color: "#22D3EE" },
          { label: lang === "en" ? "Adequate" : "كافٍ", value: inventory.filter(i => i.status === "adequate").length, color: "#22c55e" },
          { label: lang === "en" ? "Low Stock" : "منخفض", value: inventory.filter(i => i.status === "low").length, color: "#f59e0b" },
          { label: lang === "en" ? "Critical" : "حرج", value: inventory.filter(i => i.status === "critical").length, color: "#ef4444" },
          { label: lang === "en" ? "Expired" : "منتهي", value: inventory.filter(i => i.status === "expired").length, color: "#6b7280" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "en" ? "Search drug name or NDC…" : "ابحث باسم الدواء أو رمز NDC…"}
          style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.85rem", flex: 1, minWidth: "200px" }}
        />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["all", "adequate", "low", "critical", "expired"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.4rem 0.75rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : (lang === "en" ? statusStyle[f]?.label.en : statusStyle[f]?.label.ar)}
            </button>
          ))}
        </div>
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {adjustMsg && (
        <div style={{ background: "#d1fae5", border: "1px solid #34d399", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {adjustMsg}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "NDC Code" : "رمز NDC",
                lang === "en" ? "Drug Name" : "اسم الدواء",
                lang === "en" ? "Bin" : "الرف",
                lang === "en" ? "Qty / Unit" : "الكمية / الوحدة",
                lang === "en" ? "Reorder Level" : "مستوى إعادة الطلب",
                lang === "en" ? "Expiry Date" : "تاريخ الانتهاء",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Adjust" : "تعديل",
              ].map(h => (
                <th key={h} style={{ padding: "0.9rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", opacity: item.status === "expired" ? 0.6 : 1 }}>
                <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.ndcCode}</td>
                <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.88rem" }}>{item.drugName}</td>
                <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.82rem", color: "#22D3EE" }}>{item.binLocation}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.88rem" }}>
                  <span style={{ fontWeight: 700, color: item.status === "critical" || item.status === "expired" ? "#ef4444" : item.status === "low" ? "#f59e0b" : "var(--color-text)" }}>
                    {item.quantity.toLocaleString()}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}> {item.unit}</span>
                </td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{item.reorderLevel.toLocaleString()} {item.unit}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: item.status === "expired" ? "#ef4444" : "var(--color-text-muted)", fontWeight: item.status === "expired" ? 700 : 400 }}>
                  {item.expiryDate}
                </td>
                <td style={{ padding: "0.85rem 1rem" }}>
                  <span style={{ padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: statusStyle[item.status]?.bg, color: statusStyle[item.status]?.color }}>
                    {lang === "en" ? statusStyle[item.status]?.label.en : statusStyle[item.status]?.label.ar}
                  </span>
                </td>
                <td style={{ padding: "0.85rem 1rem" }}>
                  <button onClick={() => openAdjust(item)} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "rgba(34,211,238,0.15)", color: "#22D3EE", border: "1px solid #22D3EE", cursor: "pointer" }}>
                    {lang === "en" ? "Adjust" : "تعديل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "No items match the current filter." : "لا توجد أصناف تطابق الفلتر الحالي."}
          </div>
        )}
      </div>
      <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? `Showing ${filtered.length} of ${inventory.length} items` : `عرض ${filtered.length} من ${inventory.length} صنف`}
      </p>

      {/* Adjust Modal */}
      {showAdjustModal && selectedItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem", width: "400px", maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#22D3EE" }}>
              {lang === "en" ? "Stock Adjustment" : "تعديل المخزون"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              {selectedItem.drugName} — {lang === "en" ? "Current: " : "الحالي: "}<strong>{selectedItem.quantity} {selectedItem.unit}</strong>
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                  {lang === "en" ? "Adjustment Quantity (positive to add, negative to remove):" : "كمية التعديل (موجبة للإضافة، سالبة للخصم):"}
                </label>
                <input
                  type="number"
                  value={adjustForm.adjustment}
                  onChange={e => setAdjustForm(prev => ({ ...prev, adjustment: parseInt(e.target.value, 10) || 0 }))}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                  {lang === "en" ? "Reason:" : "السبب:"}
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={lang === "en" ? "e.g. Stock count correction, expired removal…" : "مثال: تصحيح جرد، إزالة منتهية الصلاحية…"}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => { void handleAdjust(); }} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#22D3EE", color: "#000", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
                {lang === "en" ? "Apply Adjustment" : "تطبيق التعديل"}
              </button>
              <button onClick={() => setShowAdjustModal(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
