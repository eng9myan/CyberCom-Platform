"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  test_name: string;
  test_name_ar: string;
  loinc_code: string;
  ordered_by: string;
  department: string;
  priority: "STAT" | "routine" | "urgent";
  status: "pending" | "collected" | "processing" | "resulted" | "cancelled";
  ordered_at: string;
}

const MOCK_ORDERS: LabOrder[] = [
  { id: "1", order_number: "LO-2026-001", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", test_name: "Complete Blood Count", test_name_ar: "تعداد الدم الكامل", loinc_code: "58410-2", ordered_by: "Dr. Nadia Karimi", department: "Emergency", priority: "STAT", status: "processing", ordered_at: "08:45" },
  { id: "2", order_number: "LO-2026-002", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", test_name: "Comprehensive Metabolic Panel", test_name_ar: "لوحة التمثيل الغذائي الشاملة", loinc_code: "24323-8", ordered_by: "Dr. Ibrahim Yousif", department: "Internal Medicine", priority: "urgent", status: "collected", ordered_at: "09:10" },
  { id: "3", order_number: "LO-2026-003", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", test_name: "HbA1c", test_name_ar: "الهيموجلوبين الغليكوزيلي", loinc_code: "4548-4", ordered_by: "Dr. Sara Hassan", department: "Endocrinology", priority: "routine", status: "resulted", ordered_at: "07:30" },
  { id: "4", order_number: "LO-2026-004", patient_name: "Leila Nouri", patient_name_ar: "ليلى نوري", mrn: "MRN-004524", test_name: "Thyroid Stimulating Hormone", test_name_ar: "هرمون تحفيز الغدة الدرقية", loinc_code: "3016-3", ordered_by: "Dr. Khalid Al-Rashid", department: "Endocrinology", priority: "urgent", status: "pending", ordered_at: "09:45" },
  { id: "5", order_number: "LO-2026-005", patient_name: "Omar Hassan", patient_name_ar: "عمر حسن", mrn: "MRN-004525", test_name: "Blood Culture x2", test_name_ar: "زرع دم", loinc_code: "600-7", ordered_by: "Dr. Aisha Mohammed", department: "ICU", priority: "STAT", status: "processing", ordered_at: "08:00" },
  { id: "6", order_number: "LO-2026-006", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-004526", test_name: "Prothrombin Time / INR", test_name_ar: "وقت البروثرومبين", loinc_code: "5902-2", ordered_by: "Dr. Tarek Jaber", department: "Cardiology", priority: "urgent", status: "collected", ordered_at: "10:05" },
  { id: "7", order_number: "LO-2026-007", patient_name: "Khalid Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-004527", test_name: "Lipid Panel", test_name_ar: "لوحة الدهون", loinc_code: "57698-3", ordered_by: "Dr. Rania Kassem", department: "Cardiology", priority: "routine", status: "pending", ordered_at: "10:20" },
  { id: "8", order_number: "LO-2026-008", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-004528", test_name: "Urinalysis Complete", test_name_ar: "تحليل البول الكامل", loinc_code: "24357-6", ordered_by: "Dr. Omar Suleiman", department: "Urology", priority: "routine", status: "resulted", ordered_at: "07:00" },
  { id: "9", order_number: "LO-2026-009", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-004529", test_name: "Serum Creatinine", test_name_ar: "كرياتينين المصل", loinc_code: "2160-0", ordered_by: "Dr. Nour Al-Din", department: "Nephrology", priority: "urgent", status: "processing", ordered_at: "09:30" },
  { id: "10", order_number: "LO-2026-010", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", test_name: "C-Reactive Protein", test_name_ar: "بروتين سي التفاعلي", loinc_code: "1988-5", ordered_by: "Dr. Aisha Nouri", department: "Rheumatology", priority: "routine", status: "pending", ordered_at: "10:45" },
  { id: "11", order_number: "LO-2026-011", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-004531", test_name: "Troponin I High Sensitivity", test_name_ar: "تروبونين آي عالي الحساسية", loinc_code: "89579-7", ordered_by: "Dr. Hassan Al-Rashid", department: "Emergency", priority: "STAT", status: "processing", ordered_at: "08:15" },
  { id: "12", order_number: "LO-2026-012", patient_name: "Bilal Shaikh", patient_name_ar: "بلال الشيخ", mrn: "MRN-004532", test_name: "Ferritin", test_name_ar: "فيريتين", loinc_code: "2276-4", ordered_by: "Dr. Maya Yousef", department: "Hematology", priority: "routine", status: "resulted", ordered_at: "07:45" },
  { id: "13", order_number: "LO-2026-013", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-004533", test_name: "Vitamin D 25-OH", test_name_ar: "فيتامين د", loinc_code: "62292-8", ordered_by: "Dr. Ziad Khalil", department: "Endocrinology", priority: "routine", status: "pending", ordered_at: "11:00" },
  { id: "14", order_number: "LO-2026-014", patient_name: "Nasser Al-Qahtani", patient_name_ar: "ناصر القحطاني", mrn: "MRN-004534", test_name: "Liver Function Tests", test_name_ar: "وظائف الكبد", loinc_code: "24325-3", ordered_by: "Dr. Layla Amin", department: "Gastroenterology", priority: "urgent", status: "collected", ordered_at: "09:50" },
  { id: "15", order_number: "LO-2026-015", patient_name: "Dina Farouk", patient_name_ar: "دينا فاروق", mrn: "MRN-004535", test_name: "Anti-dsDNA Antibody", test_name_ar: "الأجسام المضادة للحمض النووي", loinc_code: "5088-0", ordered_by: "Dr. Sara Hassan", department: "Rheumatology", priority: "routine", status: "processing", ordered_at: "08:30" },
  { id: "16", order_number: "LO-2026-016", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", test_name: "Serum Potassium", test_name_ar: "بوتاسيوم المصل", loinc_code: "2823-3", ordered_by: "Dr. Nadia Karimi", department: "ICU", priority: "STAT", status: "resulted", ordered_at: "07:20" },
  { id: "17", order_number: "LO-2026-017", patient_name: "Layla Hussain", patient_name_ar: "ليلى حسين", mrn: "MRN-004537", test_name: "Blood Type & Screen", test_name_ar: "تحديد فصيلة الدم", loinc_code: "882-1", ordered_by: "Dr. Khalid Al-Rashid", department: "Surgery", priority: "urgent", status: "collected", ordered_at: "10:30" },
  { id: "18", order_number: "LO-2026-018", patient_name: "Samir Boutros", patient_name_ar: "سامر بطرس", mrn: "MRN-004538", test_name: "Urine Culture", test_name_ar: "زرع البول", loinc_code: "630-4", ordered_by: "Dr. Ibrahim Yousif", department: "Urology", priority: "routine", status: "processing", ordered_at: "09:00" },
  { id: "19", order_number: "LO-2026-019", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-004539", test_name: "Testosterone Total", test_name_ar: "هرمون التستوستيرون", loinc_code: "2986-8", ordered_by: "Dr. Aisha Mohammed", department: "Endocrinology", priority: "routine", status: "pending", ordered_at: "11:15" },
  { id: "20", order_number: "LO-2026-020", patient_name: "Amr Khalil", patient_name_ar: "عمرو خليل", mrn: "MRN-004540", test_name: "D-Dimer", test_name_ar: "ديمر د", loinc_code: "48066-5", ordered_by: "Dr. Tarek Jaber", department: "Emergency", priority: "STAT", status: "processing", ordered_at: "08:55" },
  { id: "21", order_number: "LO-2026-021", patient_name: "Joud Al-Harbi", patient_name_ar: "جود الحربي", mrn: "MRN-004541", test_name: "Serum Sodium", test_name_ar: "صوديوم المصل", loinc_code: "2951-2", ordered_by: "Dr. Rania Kassem", department: "Nephrology", priority: "urgent", status: "resulted", ordered_at: "07:10" },
  { id: "22", order_number: "LO-2026-022", patient_name: "Hisham Al-Omari", patient_name_ar: "هشام العمري", mrn: "MRN-004542", test_name: "Beta hCG Quantitative", test_name_ar: "هرمون الحمل الكمي", loinc_code: "2118-8", ordered_by: "Dr. Maya Yousef", department: "OB-GYN", priority: "urgent", status: "collected", ordered_at: "10:00" },
  { id: "23", order_number: "LO-2026-023", patient_name: "Yasmin Othman", patient_name_ar: "ياسمين عثمان", mrn: "MRN-004543", test_name: "Sputum AFB Smear", test_name_ar: "مسحة البصاق للمتفطرات", loinc_code: "11545-1", ordered_by: "Dr. Omar Suleiman", department: "Pulmonology", priority: "routine", status: "processing", ordered_at: "08:10" },
  { id: "24", order_number: "LO-2026-024", patient_name: "Talal Al-Dosari", patient_name_ar: "طلال الدوسري", mrn: "MRN-004544", test_name: "NT-proBNP", test_name_ar: "الببتيد الناتريوريتيكي", loinc_code: "33762-6", ordered_by: "Dr. Nour Al-Din", department: "Cardiology", priority: "urgent", status: "pending", ordered_at: "11:30" },
  { id: "25", order_number: "LO-2026-025", patient_name: "Rana Barakat", patient_name_ar: "رنا بركات", mrn: "MRN-004545", test_name: "Reticulocyte Count", test_name_ar: "تعداد الشبكيات", loinc_code: "17849-1", ordered_by: "Dr. Layla Amin", department: "Hematology", priority: "routine", status: "cancelled", ordered_at: "06:50" },
];

function priorityColor(p: string) {
  if (p === "STAT") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    pending: "#6b7280",
    collected: "#3b82f6",
    processing: "#f59e0b",
    resulted: "#22c55e",
    cancelled: "#ef4444",
  };
  return map[s] || "#6b7280";
}

const DEPARTMENTS = ["All", "Emergency", "ICU", "Internal Medicine", "Cardiology", "Endocrinology", "Nephrology", "Hematology", "Urology", "Gastroenterology", "Rheumatology", "Pulmonology", "Surgery", "OB-GYN"];

export default function LabOrdersPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [orders, setOrders] = useState<LabOrder[]>(MOCK_ORDERS);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<LabOrder[]>("/api/v1/lab/orders/");
        if (Array.isArray(data) && data.length > 0) setOrders(data);
      } catch {
        // silently fall back to mock data
      }
    }
    void load();
  }, []);

  const filtered = orders.filter(o => {
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (departmentFilter !== "All" && o.department !== departmentFilter) return false;
    return true;
  });

  function handleMarkCollected(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "collected" as const } : o));
  }

  function handleCancel(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" as const } : o));
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>
              {t("← Laboratory", "← المختبر")}
            </a>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>
            {t("Lab Order Management", "إدارة طلبات المختبر")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Track and manage laboratory test orders", "تتبع وإدارة طلبات الفحوصات المخبرية")}
          </p>
        </div>
        <button
          onClick={() => setLang(l => l === "en" ? "ar" : "en")}
          style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}
        >
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/orders" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/orders" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/orders" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Total Orders", "إجمالي الطلبات"), value: orders.length, color: "#6366f1" },
          { label: t("Pending", "معلقة"), value: orders.filter(o => o.status === "pending").length, color: "#6b7280" },
          { label: t("Collected", "مجمّعة"), value: orders.filter(o => o.status === "collected").length, color: "#3b82f6" },
          { label: t("Processing", "قيد المعالجة"), value: orders.filter(o => o.status === "processing").length, color: "#f59e0b" },
          { label: t("Resulted", "صدرت نتائجها"), value: orders.filter(o => o.status === "resulted").length, color: "#22c55e" },
          { label: t("STAT Orders", "طلبات عاجلة"), value: orders.filter(o => o.priority === "STAT").length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Priority", "الأولوية")}</span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {["all", "STAT", "urgent", "routine"].map(f => (
              <button key={f} onClick={() => setPriorityFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: priorityFilter === f ? "#22D3EE" : "var(--color-background)", color: priorityFilter === f ? "#000" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Status", "الحالة")}</span>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {["all", "pending", "collected", "processing", "resulted", "cancelled"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: statusFilter === f ? "#22D3EE" : "var(--color-background)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Department", "القسم")}</span>
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.8rem" }}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          {t("Showing", "عرض")} {filtered.length} / {orders.length} {t("orders", "طلب")}
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Test / LOINC", "الفحص / LOINC"), t("Ordered By", "طلبه"), t("Dept", "القسم"), t("Priority", "الأولوية"), t("Status", "الحالة"), t("Time", "الوقت"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order, i) => (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-background)" }}>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE", whiteSpace: "nowrap" }}>{order.order_number}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? order.patient_name_ar : order.patient_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{order.mrn}</div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontSize: "0.85rem" }}>{lang === "ar" ? order.test_name_ar : order.test_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{order.loinc_code}</div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{order.ordered_by}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{order.department}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: priorityColor(order.priority) + "22", color: priorityColor(order.priority), border: `1px solid ${priorityColor(order.priority)}` }}>
                    {order.priority}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: statusColor(order.status) + "22", color: statusColor(order.status) }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{order.ordered_at}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    {order.status === "pending" && (
                      <button onClick={() => handleMarkCollected(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {t("Collect", "جمع")}
                      </button>
                    )}
                    {(order.status === "pending" || order.status === "collected") && (
                      <button onClick={() => handleCancel(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#ef444422", color: "#ef4444", border: "1px solid #ef4444", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {t("Cancel", "إلغاء")}
                      </button>
                    )}
                    <button style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "var(--color-background)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)", whiteSpace: "nowrap" }}>
                      {t("View", "عرض")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {t("No orders match the selected filters.", "لا توجد طلبات تطابق المرشحات المختارة.")}
          </div>
        )}
      </div>
    </div>
  );
}
