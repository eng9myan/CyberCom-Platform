"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ImagingOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  modality: "CT" | "MRI" | "X-Ray" | "Ultrasound" | "NM" | "PET";
  body_part: string;
  body_part_ar: string;
  clinical_indication: string;
  ordered_by: string;
  priority: "STAT" | "urgent" | "routine";
  status: "pending" | "approved" | "scheduled" | "cancelled" | "completed";
  ordered_at: string;
}

const MOCK_ORDERS: ImagingOrder[] = [
  { id: "1", order_number: "IMG-2026-4401", patient_name: "Khaled Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-007812", modality: "CT", body_part: "Brain", body_part_ar: "الدماغ", clinical_indication: "Acute headache, rule out intracranial hemorrhage", ordered_by: "Dr. Rania Kassem", priority: "STAT", status: "approved", ordered_at: "08:30" },
  { id: "2", order_number: "IMG-2026-4402", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-007813", modality: "MRI", body_part: "Lumbar Spine", body_part_ar: "العمود الفقري القطني", clinical_indication: "Chronic lower back pain, radiculopathy", ordered_by: "Dr. Omar Suleiman", priority: "routine", status: "scheduled", ordered_at: "09:15" },
  { id: "3", order_number: "IMG-2026-4403", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-007814", modality: "X-Ray", body_part: "Chest PA & Lateral", body_part_ar: "صدر PA ولاتيرال", clinical_indication: "Cough, fever, rule out pneumonia", ordered_by: "Dr. Aisha Nouri", priority: "urgent", status: "completed", ordered_at: "07:45" },
  { id: "4", order_number: "IMG-2026-4404", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-007815", modality: "Ultrasound", body_part: "Abdomen Complete", body_part_ar: "البطن الكامل", clinical_indication: "RUQ pain, rule out cholelithiasis", ordered_by: "Dr. Hassan Al-Rashid", priority: "routine", status: "approved", ordered_at: "10:00" },
  { id: "5", order_number: "IMG-2026-4405", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-007816", modality: "CT", body_part: "Chest PE Protocol", body_part_ar: "صدر بروتوكول الصمة الرئوية", clinical_indication: "Dyspnea, elevated D-Dimer, rule out PE", ordered_by: "Dr. Nadia Al-Sayed", priority: "STAT", status: "pending", ordered_at: "10:15" },
  { id: "6", order_number: "IMG-2026-4406", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-007817", modality: "CT", body_part: "Abdomen & Pelvis", body_part_ar: "البطن والحوض", clinical_indication: "Acute abdominal pain, rule out appendicitis", ordered_by: "Dr. Khalid Al-Rashid", priority: "urgent", status: "approved", ordered_at: "09:30" },
  { id: "7", order_number: "IMG-2026-4407", patient_name: "Bilal Shaikh", patient_name_ar: "بلال الشيخ", mrn: "MRN-007818", modality: "MRI", body_part: "Brain with Contrast", body_part_ar: "الدماغ مع صبغة", clinical_indication: "New onset seizure, evaluate for lesion", ordered_by: "Dr. Layla Amin", priority: "urgent", status: "scheduled", ordered_at: "08:00" },
  { id: "8", order_number: "IMG-2026-4408", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-007819", modality: "Ultrasound", body_part: "Pelvis Transvaginal", body_part_ar: "الحوض عبر المهبل", clinical_indication: "Pelvic pain, evaluate ovaries", ordered_by: "Dr. Maya Yousef", priority: "routine", status: "pending", ordered_at: "11:00" },
  { id: "9", order_number: "IMG-2026-4409", patient_name: "Nasser Al-Qahtani", patient_name_ar: "ناصر القحطاني", mrn: "MRN-007820", modality: "X-Ray", body_part: "Right Knee AP & Lateral", body_part_ar: "الركبة اليمنى", clinical_indication: "Knee pain after fall, rule out fracture", ordered_by: "Dr. Ziad Khalil", priority: "urgent", status: "completed", ordered_at: "09:45" },
  { id: "10", order_number: "IMG-2026-4410", patient_name: "Dina Farouk", patient_name_ar: "دينا فاروق", mrn: "MRN-007821", modality: "CT", body_part: "Neck Soft Tissue", body_part_ar: "أنسجة الرقبة اللينة", clinical_indication: "Neck mass, evaluate for malignancy", ordered_by: "Dr. Sara Hassan", priority: "urgent", status: "approved", ordered_at: "10:30" },
  { id: "11", order_number: "IMG-2026-4411", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-007822", modality: "MRI", body_part: "Cervical Spine", body_part_ar: "العمود الفقري العنقي", clinical_indication: "Neck pain, radiculopathy, myelopathy evaluation", ordered_by: "Dr. Ibrahim Yousif", priority: "routine", status: "pending", ordered_at: "11:30" },
  { id: "12", order_number: "IMG-2026-4412", patient_name: "Layla Hussain", patient_name_ar: "ليلى حسين", mrn: "MRN-007823", modality: "Ultrasound", body_part: "Thyroid", body_part_ar: "الغدة الدرقية", clinical_indication: "Palpable thyroid nodule, characterize", ordered_by: "Dr. Khalid Al-Rashid", priority: "routine", status: "scheduled", ordered_at: "10:45" },
  { id: "13", order_number: "IMG-2026-4413", patient_name: "Samir Boutros", patient_name_ar: "سامر بطرس", mrn: "MRN-007824", modality: "X-Ray", body_part: "Left Hand PA & Oblique", body_part_ar: "اليد اليسرى", clinical_indication: "Hand pain, exclude fracture", ordered_by: "Dr. Aisha Mohammed", priority: "routine", status: "completed", ordered_at: "08:20" },
  { id: "14", order_number: "IMG-2026-4414", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-007825", modality: "CT", body_part: "Sinuses", body_part_ar: "الجيوب الأنفية", clinical_indication: "Chronic sinusitis, pre-operative planning", ordered_by: "Dr. Tarek Jaber", priority: "routine", status: "pending", ordered_at: "12:00" },
  { id: "15", order_number: "IMG-2026-4415", patient_name: "Amr Khalil", patient_name_ar: "عمرو خليل", mrn: "MRN-007826", modality: "CT", body_part: "Coronary Angiography", body_part_ar: "قسطرة الشريان التاجي بالأشعة", clinical_indication: "Atypical chest pain, CAD risk stratification", ordered_by: "Dr. Nour Al-Din", priority: "urgent", status: "approved", ordered_at: "09:00" },
  { id: "16", order_number: "IMG-2026-4416", patient_name: "Joud Al-Harbi", patient_name_ar: "جود الحربي", mrn: "MRN-007827", modality: "MRI", body_part: "Liver with Contrast", body_part_ar: "الكبد مع صبغة", clinical_indication: "Hepatic lesion on ultrasound, characterize", ordered_by: "Dr. Rania Kassem", priority: "urgent", status: "scheduled", ordered_at: "08:50" },
  { id: "17", order_number: "IMG-2026-4417", patient_name: "Hisham Al-Omari", patient_name_ar: "هشام العمري", mrn: "MRN-007828", modality: "NM", body_part: "Bone Scan", body_part_ar: "مسح العظام", clinical_indication: "Prostate cancer, evaluate for bone metastases", ordered_by: "Dr. Omar Suleiman", priority: "routine", status: "pending", ordered_at: "10:00" },
  { id: "18", order_number: "IMG-2026-4418", patient_name: "Yasmin Othman", patient_name_ar: "ياسمين عثمان", mrn: "MRN-007829", modality: "X-Ray", body_part: "Pelvis AP", body_part_ar: "الحوض AP", clinical_indication: "Hip pain, evaluate for fracture / arthritis", ordered_by: "Dr. Layla Amin", priority: "routine", status: "cancelled", ordered_at: "11:15" },
];

const MODALITY_COLORS: Record<string, string> = {
  "CT": "#3b82f6",
  "MRI": "#8b5cf6",
  "X-Ray": "#22c55e",
  "Ultrasound": "#f59e0b",
  "NM": "#ec4899",
  "PET": "#14b8a6",
};

function priorityColor(p: string) {
  if (p === "STAT") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    pending: "#6b7280",
    approved: "#3b82f6",
    scheduled: "#8b5cf6",
    cancelled: "#ef4444",
    completed: "#22c55e",
  };
  return map[s] || "#6b7280";
}

export default function ImagingOrdersPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [orders, setOrders] = useState<ImagingOrder[]>(MOCK_ORDERS);
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<ImagingOrder[]>("/api/v1/imaging/orders/");
        if (Array.isArray(data) && data.length > 0) setOrders(data);
      } catch {
        // silently fall back to mock data
      }
    }
    void load();
  }, []);

  const filtered = orders.filter(o => {
    if (modalityFilter !== "all" && o.modality !== modalityFilter) return false;
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  function handleApprove(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "approved" as const } : o));
  }

  function handleSchedule(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "scheduled" as const } : o));
  }

  function handleCancel(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" as const } : o));
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/imaging" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>
            {t("← Imaging", "← التصوير")}
          </a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", marginTop: "0.25rem" }}>
            {t("Radiology Order Management", "إدارة طلبات الأشعة")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Approve, schedule, and track imaging orders", "الموافقة على طلبات التصوير وجدولتها وتتبعها")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/imaging/orders" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/imaging/orders" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/imaging/orders" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Total Orders", "إجمالي الطلبات"), value: orders.length, color: "#6366f1" },
          { label: t("Pending", "معلقة"), value: orders.filter(o => o.status === "pending").length, color: "#6b7280" },
          { label: t("Approved", "موافق عليها"), value: orders.filter(o => o.status === "approved").length, color: "#3b82f6" },
          { label: t("Scheduled", "مجدولة"), value: orders.filter(o => o.status === "scheduled").length, color: "#8b5cf6" },
          { label: t("Completed", "مكتملة"), value: orders.filter(o => o.status === "completed").length, color: "#22c55e" },
          { label: t("STAT", "عاجلة"), value: orders.filter(o => o.priority === "STAT").length, color: "#ef4444" },
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
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Modality", "الطريقة")}</span>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {["all", "CT", "MRI", "X-Ray", "Ultrasound", "NM", "PET"].map(f => (
              <button key={f} onClick={() => setModalityFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: modalityFilter === f ? (MODALITY_COLORS[f] || "#22D3EE") : "var(--color-background)", color: modalityFilter === f ? "#fff" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
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
            {["all", "pending", "approved", "scheduled", "completed", "cancelled"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: statusFilter === f ? "#22D3EE" : "var(--color-background)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{filtered.length} / {orders.length}</span>
      </div>

      {/* Orders Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Modality", "الطريقة"), t("Body Part", "المنطقة"), t("Indication", "المؤشر"), t("Ordered By", "طلبه"), t("Priority", "الأولوية"), t("Status", "الحالة"), t("Time", "الوقت"), t("Actions", "الإجراءات")].map(h => (
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
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, background: (MODALITY_COLORS[order.modality] || "#6b7280") + "22", color: MODALITY_COLORS[order.modality] || "#6b7280" }}>
                    {order.modality}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem" }}>{lang === "ar" ? order.body_part_ar : order.body_part}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)", maxWidth: "180px" }}>{order.clinical_indication}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{order.ordered_by}</td>
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
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    {order.status === "pending" && (
                      <button onClick={() => handleApprove(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {t("Approve", "موافقة")}
                      </button>
                    )}
                    {order.status === "approved" && (
                      <button onClick={() => handleSchedule(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {t("Schedule", "جدولة")}
                      </button>
                    )}
                    {(order.status === "pending" || order.status === "approved") && (
                      <button onClick={() => handleCancel(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#ef444422", color: "#ef4444", border: "1px solid #ef4444", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {t("Cancel", "إلغاء")}
                      </button>
                    )}
                    <button style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "var(--color-background)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)" }}>
                      {t("View", "عرض")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
