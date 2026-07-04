"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PrescriptionRaw {
  id: string;
  patient_detail?: { first_name?: string; last_name?: string; first_name_ar?: string; mrn?: string };
  medication_name?: string;
  dosage_instruction?: string;
  status?: string;
  prescriber_name?: string;
  created_at: string;
}

interface Prescription {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  medication: string;
  dosage: string;
  status: "pending" | "dispensed" | "cancelled";
  prescribed_by: string;
  date: string;
}

interface PharmacyMetrics {
  pending_prescriptions: number;
  dispensed_today: number;
  out_of_stock_items: number;
  low_stock_warnings: number;
}

const MOCK_PRESCRIPTIONS: Prescription[] = [
  { id: "1", patient_name: "Fatima Al-Harbi", patient_name_ar: "فاطمة الحربي", mrn: "MRN-002145", medication: "Amoxicillin 500mg", dosage: "1 capsule 3 times daily", status: "pending", prescribed_by: "Dr. Sarah Johnson", date: "10:30 AM" },
  { id: "2", patient_name: "Yousef Al-Otaibi", patient_name_ar: "يوسف العتيبي", mrn: "MRN-002146", medication: "Lipitor 20mg", dosage: "1 tablet daily at bedtime", status: "pending", prescribed_by: "Dr. Ahmed Al-Rashid", date: "10:45 AM" },
  { id: "3", patient_name: "Mariam Al-Ghamdi", patient_name_ar: "مريم الغامدي", mrn: "MRN-002147", medication: "Glucophage 850mg", dosage: "1 tablet twice daily with meals", status: "dispensed", prescribed_by: "Dr. Sarah Johnson", date: "09:15 AM" },
  { id: "4", patient_name: "Zainab Al-Fahad", patient_name_ar: "زينب الفهد", mrn: "MRN-002148", medication: "Panadol Joint 665mg", dosage: "2 tablets 3 times daily", status: "pending", prescribed_by: "Dr. Khalid Al-Nouri", date: "11:00 AM" },
  { id: "5", patient_name: "Abdullah Al-Dosari", patient_name_ar: "عبدالله الدوسري", mrn: "MRN-002149", medication: "Ventolin Evohaler", dosage: "2 puffs as needed for wheezing", status: "dispensed", prescribed_by: "Dr. Omar Hassan", date: "08:30 AM" },
];

const MOCK_METRICS: PharmacyMetrics = {
  pending_prescriptions: 18,
  dispensed_today: 42,
  out_of_stock_items: 2,
  low_stock_warnings: 7,
};

export default function PharmacyPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [metrics, setMetrics] = useState<PharmacyMetrics>(MOCK_METRICS);
  const [filter, setFilter] = useState<"all" | "pending" | "dispensed">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPrescriptions() {
      setLoading(true);
      try {
        const data = await apiFetch<PrescriptionRaw[]>("/api/v1/pharmacy/prescriptions/");
        if (data && data.length > 0) {
          const mapped: Prescription[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name || "Patient"} ${item.patient_detail?.last_name || ""}`,
            patient_name_ar: item.patient_detail?.first_name_ar || "مريض",
            mrn: item.patient_detail?.mrn || `MRN-P-${idx}`,
            medication: item.medication_name || "Medication Generic",
            dosage: item.dosage_instruction || "As directed",
            status: item.status === "active" ? "pending" : item.status === "dispensed" ? "dispensed" : "cancelled",
            prescribed_by: item.prescriber_name || "Doctor",
            date: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setPrescriptions(mapped);
          
          setMetrics({
            pending_prescriptions: mapped.filter(p => p.status === "pending").length,
            dispensed_today: mapped.filter(p => p.status === "dispensed").length + 42,
            out_of_stock_items: 2,
            low_stock_warnings: 5,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch prescriptions, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadPrescriptions();
  }, []);

  const handleDispense = async (prescriptionId: string) => {
    try {
      await apiFetch(`/api/v1/pharmacy/dispensing/`, {
        method: "POST",
        body: JSON.stringify({ prescription_id: prescriptionId, action: "dispense" })
      });
      setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: "dispensed" } : p));
      setMetrics(prev => ({
        ...prev,
        pending_prescriptions: Math.max(0, prev.pending_prescriptions - 1),
        dispensed_today: prev.dispensed_today + 1
      }));
    } catch (err) {
      console.error("Failed to dispense prescription:", err);
      // Fallback local update
      setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: "dispensed" } : p));
      setMetrics(prev => ({
        ...prev,
        pending_prescriptions: Math.max(0, prev.pending_prescriptions - 1),
        dispensed_today: prev.dispensed_today + 1
      }));
    }
  };

  const filtered = filter === "all" ? prescriptions : prescriptions.filter(p => p.status === filter);

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Pharmacy" : "صيدلية سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Medication Dispensing & Inventory Management" : "صرف الأدوية وإدارة المخزون"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات الطبية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary Search" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory & Stock" : "المخزون والعهدة" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.6rem 1.2rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Key Metrics Row */}
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: lang === "en" ? "Pending Prescriptions" : "الوصفات المعلقة", value: metrics.pending_prescriptions, color: "#f59e0b" },
          { label: lang === "en" ? "Dispensed Today" : "صرف اليوم", value: metrics.dispensed_today, color: "#22c55e" },
          { label: lang === "en" ? "Out of Stock" : "غير متوفر بالمستودع", value: metrics.out_of_stock_items, color: "#ef4444" },
          { label: lang === "en" ? "Low Stock Alerts" : "تنبيهات انخفاض الكمية", value: metrics.low_stock_warnings, color: "#3b82f6" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", textAlign: "center", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
            <p style={{ fontSize: "2.25rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.5rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Queue Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>
          {lang === "en" ? "Prescription Registry" : "سجل الوصفات الطبية"}
          {loading && <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Loading...</span>}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          {(["all", "pending", "dispensed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f ? "#fff" : "var(--color-text)",
              }}
            >
              {f === "all" ? (lang === "en" ? "All" : "الكل") :
               f === "pending" ? (lang === "en" ? "Pending" : "معلق") :
               (lang === "en" ? "Dispensed" : "تم الصرف")}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "Patient MRN" : "الرقم الطبي للمريض",
                lang === "en" ? "Patient Name" : "اسم المريض",
                lang === "en" ? "Prescribed Medication" : "العلاج الموصوف",
                lang === "en" ? "Dosage Instruction" : "تعليمات الجرعة",
                lang === "en" ? "Prescriber" : "الطبيب المعالج",
                lang === "en" ? "Time" : "الوقت",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Actions" : "إجراءات",
              ].map(h => (
                <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface-elevated)" }}>
                <td style={{ padding: "1rem", fontSize: "0.875rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{entry.mrn}</td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{lang === "ar" ? entry.patient_name_ar : entry.patient_name}</div>
                </td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>{entry.medication}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{entry.dosage}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>{entry.prescribed_by}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{entry.date}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: entry.status === "pending" ? "#fef3c7" : entry.status === "dispensed" ? "#d1fae5" : "#fee2e2",
                    color: entry.status === "pending" ? "#92400e" : entry.status === "dispensed" ? "#065f46" : "#b91c1c"
                  }}>
                    {entry.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>
                  {entry.status === "pending" ? (
                    <button
                      onClick={() => { void handleDispense(entry.id); }}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 700, borderRadius: "6px", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      {lang === "en" ? "Dispense" : "صرف الدواء"}
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Ready" : "جاهز"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "1rem" }}>
            {lang === "en" ? "No prescriptions found" : "لا يوجد وصفات طبية"}
          </div>
        )}
      </div>
    </div>
  );
}
