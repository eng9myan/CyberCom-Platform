"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type OrderType = "lab" | "imaging" | "medication" | "referral";
type OrderStatus = "ordered" | "acknowledged" | "in-progress" | "resulted";

interface Order {
  id: string;
  type: OrderType;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  description: string;
  description_ar: string;
  ordered_by: string;
  ordered_at: string;
  status: OrderStatus;
  priority: "routine" | "stat" | "urgent";
}

const ORDERS: Order[] = [
  { id: "ORD-001", type: "lab", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", description: "HbA1c, Fasting Glucose, Lipid Panel", description_ar: "هيموجلوبين سكري، سكر صيام، دهون الدم", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 08:15", status: "in-progress", priority: "routine" },
  { id: "ORD-002", type: "imaging", patient_name: "Khalid Al-Zahrani", patient_name_ar: "خالد الزهراني", mrn: "MRN-003", description: "Chest CT with contrast", description_ar: "أشعة مقطعية للصدر مع تباين", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 08:30", status: "acknowledged", priority: "urgent" },
  { id: "ORD-003", type: "medication", patient_name: "Mariam Al-Harbi", patient_name_ar: "مريم الحربي", mrn: "MRN-002", description: "Amlodipine 5mg PO OD × 30 days", description_ar: "أملوديبين 5 مج فموي مرة يومياً × 30 يوم", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 09:00", status: "ordered", priority: "routine" },
  { id: "ORD-004", type: "referral", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", description: "Nephrology consult — CKD Stage 3b", description_ar: "استشارة أمراض الكلى — مرحلة 3ب", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 09:15", status: "ordered", priority: "routine" },
  { id: "ORD-005", type: "lab", patient_name: "Fatima Al-Ghamdi", patient_name_ar: "فاطمة الغامدي", mrn: "MRN-004", description: "CBC, Spirometry (baseline)", description_ar: "صورة دم كاملة، قياس وظائف الرئة", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 09:30", status: "resulted", priority: "routine" },
  { id: "ORD-006", type: "lab", patient_name: "Abdulaziz Al-Dossari", patient_name_ar: "عبدالعزيز الدوسري", mrn: "MRN-007", description: "ABG, Sputum Culture", description_ar: "تحليل غازات الدم، زرع البلغم", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 09:45", status: "in-progress", priority: "stat" },
  { id: "ORD-007", type: "imaging", patient_name: "Majed Al-Otaibi", patient_name_ar: "ماجد العتيبي", mrn: "MRN-009", description: "Echocardiogram (2D with Doppler)", description_ar: "صدى قلب ثنائي الأبعاد مع دوبلر", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 10:00", status: "acknowledged", priority: "urgent" },
  { id: "ORD-008", type: "medication", patient_name: "Saud Al-Bishi", patient_name_ar: "سعود البيشي", mrn: "MRN-011", description: "Apixaban 5mg PO BID × 90 days", description_ar: "أبيكسابان 5 مج مرتين يومياً × 90 يوم", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 10:15", status: "ordered", priority: "routine" },
  { id: "ORD-009", type: "referral", patient_name: "Sara Al-Mutairi", patient_name_ar: "سارة المطيري", mrn: "MRN-008", description: "Rheumatology — biologic therapy review", description_ar: "روماتولوجيا — مراجعة العلاج البيولوجي", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 10:30", status: "ordered", priority: "routine" },
  { id: "ORD-010", type: "lab", patient_name: "Waleed Al-Subaie", patient_name_ar: "وليد السبيعي", mrn: "MRN-019", description: "PSA total/free, Testosterone", description_ar: "PSA كلي/حر، هرمون التستوستيرون", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 10:45", status: "in-progress", priority: "routine" },
  { id: "ORD-011", type: "imaging", patient_name: "Abeer Al-Nasser", patient_name_ar: "عبير الناصر", mrn: "MRN-020", description: "Breast MRI (screening)", description_ar: "رنين مغناطيسي للثدي (مسح)", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 11:00", status: "acknowledged", priority: "routine" },
  { id: "ORD-012", type: "medication", patient_name: "Turki Al-Fahad", patient_name_ar: "تركي الفهد", mrn: "MRN-013", description: "Metformin 1000mg PO BID, Lisinopril 10mg OD", description_ar: "ميتفورمين 1000 مج مرتين، ليزينوبريل 10 مج مرة", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 11:15", status: "ordered", priority: "routine" },
  { id: "ORD-013", type: "lab", patient_name: "Hessa Al-Anazi", patient_name_ar: "حصة العنزي", mrn: "MRN-010", description: "Serum Iron, Ferritin, TIBC, Reticulocyte count", description_ar: "حديد المصل، فيريتين، TIBC، عدد الخلايا الشبكية", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 11:30", status: "resulted", priority: "routine" },
  { id: "ORD-014", type: "referral", patient_name: "Faisal Al-Jabri", patient_name_ar: "فيصل الجابري", mrn: "MRN-015", description: "Neurology — Parkinson's disease management", description_ar: "طب أعصاب — إدارة مرض باركنسون", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 11:45", status: "ordered", priority: "routine" },
  { id: "ORD-015", type: "imaging", patient_name: "Noura Al-Shehri", patient_name_ar: "نورة الشهري", mrn: "MRN-006", description: "Thyroid Ultrasound", description_ar: "تصوير بالموجات فوق الصوتية للغدة الدرقية", ordered_by: "Dr. Hassan", ordered_at: "2026-06-30 12:00", status: "acknowledged", priority: "routine" },
];

const STATUS_FLOW: OrderStatus[] = ["ordered", "acknowledged", "in-progress", "resulted"];
const STATUS_COLOR: Record<string, string> = { ordered: "#94a3b8", acknowledged: "#f59e0b", "in-progress": "#3b82f6", resulted: "#22c55e" };
const TYPE_ICON: Record<string, string> = { lab: "🧪", imaging: "🩻", medication: "💊", referral: "👨‍⚕️" };
const PRIORITY_COLOR: Record<string, string> = { routine: "#94a3b8", urgent: "#f59e0b", stat: "#ef4444" };

export default function ProviderOrders() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [activeTab, setActiveTab] = useState<OrderType | "all">("all");
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [newOrderType, setNewOrderType] = useState<OrderType>("lab");
  const [newOrderDesc, setNewOrderDesc] = useState("");
  const [newOrderPatient, setNewOrderPatient] = useState("");
  const [newOrderPriority, setNewOrderPriority] = useState<"routine" | "urgent" | "stat">("routine");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await apiFetch<Order[]>("/api/v1/provider-portal/orders/");
        if (data && Array.isArray(data) && data.length > 0) setOrders(data);
      } catch (err) {
        console.warn("Provider orders API unavailable, using mock data:", err);
      }
    }
    void fetchOrders();
  }, []);

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.type === activeTab);

  const handleSubmitOrder = () => {
    if (!newOrderDesc || !newOrderPatient) return;
    const newOrder: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      type: newOrderType,
      patient_name: newOrderPatient,
      patient_name_ar: newOrderPatient,
      mrn: "MRN-NEW",
      description: newOrderDesc,
      description_ar: newOrderDesc,
      ordered_by: "Dr. Hassan",
      ordered_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "ordered",
      priority: newOrderPriority,
    };
    setOrders(prev => [newOrder, ...prev]);
    setNewOrderDesc("");
    setNewOrderPatient("");
    setShowNewOrderForm(false);
  };

  const advanceStatus = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const idx = STATUS_FLOW.indexOf(o.status);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)] ?? o.status;
      return { ...o, status: next };
    }));
  };

  const countByType = (type: OrderType) => orders.filter(o => o.type === type).length;

  const tabs: { key: OrderType | "all"; label: string; label_ar: string }[] = [
    { key: "all", label: "All Orders", label_ar: "جميع الطلبات" },
    { key: "lab", label: `Lab (${countByType("lab")})`, label_ar: `مختبر (${countByType("lab")})` },
    { key: "imaging", label: `Imaging (${countByType("imaging")})`, label_ar: `أشعة (${countByType("imaging")})` },
    { key: "medication", label: `Medication (${countByType("medication")})`, label_ar: `دواء (${countByType("medication")})` },
    { key: "referral", label: `Referral (${countByType("referral")})`, label_ar: `إحالة (${countByType("referral")})` },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/provider-portal" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "0.5rem" }}>
            {lang === "en" ? "← Provider Portal" : "→ بوابة الطبيب"}
          </a>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Order Entry (CPOE)" : "إدخال الطلبات (CPOE)"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Computerized provider order entry — lab, imaging, medication, referral" : "نظام إدخال الطلبات الإلكترونية — مختبر، أشعة، دواء، إحالة"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setShowNewOrderForm(v => !v)} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", background: "#22D3EE", color: "#000", fontSize: "0.875rem", fontWeight: 700 }}>
            {lang === "en" ? "+ New Order" : "+ طلب جديد"}
          </button>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* New Order Form */}
      {showNewOrderForm && (
        <div style={{ background: "var(--color-surface)", border: "1px solid #22D3EE", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "#22D3EE" }}>
            {lang === "en" ? "New Order Form" : "نموذج طلب جديد"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>{lang === "en" ? "Order Type" : "نوع الطلب"}</label>
              <select value={newOrderType} onChange={e => setNewOrderType(e.target.value as OrderType)} style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}>
                {(["lab", "imaging", "medication", "referral"] as OrderType[]).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>{lang === "en" ? "Patient Name / MRN" : "اسم المريض / رقم السجل"}</label>
              <input value={newOrderPatient} onChange={e => setNewOrderPatient(e.target.value)} placeholder={lang === "en" ? "e.g. Ahmad Al-Rashidi" : "مثال: أحمد الراشدي"} style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>{lang === "en" ? "Priority" : "الأولوية"}</label>
              <select value={newOrderPriority} onChange={e => setNewOrderPriority(e.target.value as "routine" | "urgent" | "stat")} style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}>
                <option value="routine">{lang === "en" ? "Routine" : "روتيني"}</option>
                <option value="urgent">{lang === "en" ? "Urgent" : "عاجل"}</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>{lang === "en" ? "Order Description" : "وصف الطلب"}</label>
              <input value={newOrderDesc} onChange={e => setNewOrderDesc(e.target.value)} placeholder={lang === "en" ? "e.g. CBC, HbA1c, Fasting glucose" : "مثال: صورة دم كاملة، هيموجلوبين سكري"} style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button onClick={handleSubmitOrder} style={{ padding: "0.5rem 1.5rem", background: "#22D3EE", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
              {lang === "en" ? "Submit Order" : "إرسال الطلب"}
            </button>
            <button onClick={() => setShowNewOrderForm(false)} style={{ padding: "0.5rem 1.5rem", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
              {lang === "en" ? "Cancel" : "إلغاء"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: `1px solid ${activeTab === tab.key ? "#22D3EE" : "var(--color-border)"}`, background: activeTab === tab.key ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: activeTab === tab.key ? "#22D3EE" : "var(--color-text)", fontSize: "0.875rem", cursor: "pointer", fontWeight: activeTab === tab.key ? 600 : 400 }}>
            {lang === "en" ? tab.label : tab.label_ar}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(34,211,238,0.05)", borderBottom: "1px solid var(--color-border)" }}>
                {[
                  lang === "en" ? "Order ID" : "رقم الطلب",
                  lang === "en" ? "Type" : "النوع",
                  lang === "en" ? "Patient" : "المريض",
                  lang === "en" ? "Description" : "الوصف",
                  lang === "en" ? "Priority" : "الأولوية",
                  lang === "en" ? "Ordered" : "وقت الطلب",
                  lang === "en" ? "Status" : "الحالة",
                  lang === "en" ? "Action" : "الإجراء",
                ].map(h => (
                  <th key={h} style={{ padding: "0.875rem 1rem", textAlign: lang === "ar" ? "right" : "left", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", color: "#22D3EE", fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>{TYPE_ICON[o.type]}</span>
                      <span style={{ textTransform: "capitalize" }}>{lang === "en" ? o.type : o.type === "lab" ? "مختبر" : o.type === "imaging" ? "أشعة" : o.type === "medication" ? "دواء" : "إحالة"}</span>
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ fontWeight: 600 }}>{lang === "en" ? o.patient_name : o.patient_name_ar}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{o.mrn}</div>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", maxWidth: "260px" }}>{lang === "en" ? o.description : o.description_ar}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ color: PRIORITY_COLOR[o.priority], fontWeight: 600, fontSize: "0.8125rem", textTransform: "uppercase" }}>{lang === "en" ? o.priority : o.priority === "stat" ? "STAT" : o.priority === "urgent" ? "عاجل" : "روتيني"}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{o.ordered_at}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLOR[o.status], display: "inline-block" }} />
                      <span style={{ color: STATUS_COLOR[o.status], fontWeight: 600, fontSize: "0.8125rem", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                        {lang === "en" ? o.status : o.status === "ordered" ? "مُطلوب" : o.status === "acknowledged" ? "مستلم" : o.status === "in-progress" ? "قيد التنفيذ" : "مكتمل"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    {o.status !== "resulted" && (
                      <button onClick={() => advanceStatus(o.id)} style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "transparent", color: "#22D3EE", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>
                        {lang === "en" ? "Advance" : "تقدم"}
                      </button>
                    )}
                    {o.status === "resulted" && (
                      <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>{lang === "en" ? "Complete" : "مكتمل"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
          {lang === "en" ? `${filtered.length} orders` : `${filtered.length} طلب`}
        </div>
      </div>

      {/* Status Workflow Legend */}
      <div style={{ marginTop: "1.5rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1rem 1.5rem" }}>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", fontWeight: 600 }}>
          {lang === "en" ? "Order Status Workflow" : "مراحل حالة الطلب"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {STATUS_FLOW.map((s, i) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ padding: "0.25rem 0.75rem", borderRadius: "6px", background: `${STATUS_COLOR[s]}20`, color: STATUS_COLOR[s], fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize" }}>{s}</span>
              {i < STATUS_FLOW.length - 1 && <span style={{ color: "var(--color-text-muted)" }}>→</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
