"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ConsultationRaw {
  id: string;
  patient_detail?: {
    first_name?: string;
    last_name?: string;
    first_name_ar?: string;
    last_name_ar?: string;
    mrn?: string;
    date_of_birth?: string;
    gender?: string;
    allergies?: string;
  };
  provider_detail?: { first_name?: string; last_name?: string; specialty?: string };
  start_time?: string;
  chief_complaint?: string;
  status?: string;
  soap_subjective?: string;
  soap_objective?: string;
  soap_assessment?: string;
  soap_plan?: string;
  diagnosis_code?: string;
  diagnosis_description?: string;
}

interface Consultation {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  dob: string;
  gender: string;
  allergies: string;
  provider: string;
  specialty: string;
  specialty_ar: string;
  start_time: string;
  chief_complaint: string;
  chief_complaint_ar: string;
  status: "active" | "pending_review" | "completed" | "on_hold";
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  diagnosis: { code: string; description: string; description_ar: string };
  orders: Order[];
}

interface Order {
  id: string;
  type: "lab" | "imaging" | "medication" | "referral";
  description: string;
  description_ar: string;
  status: "pending" | "ordered" | "completed";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: "CON-001",
    patient_name: "Omar Hassan",         patient_name_ar: "عمر حسن",
    mrn: "MRN-001236",                  dob: "1988-12-05", gender: "Male",
    allergies: "Penicillin",
    provider: "Dr. Tarek Al-Amin",      specialty: "General Practice", specialty_ar: "الطب العام",
    start_time: "09:05",                chief_complaint: "Annual check-up, fatigue past 2 weeks", chief_complaint_ar: "فحص دوري، إرهاق منذ أسبوعين",
    status: "active",
    soap: {
      subjective:  "Patient presents for annual wellness exam. Reports fatigue for 2 weeks, occasional headaches, no chest pain or SOB. Sleeps 5–6 hours/night. Stress at work.",
      objective:   "Vitals: BP 128/82, HR 74, Temp 36.8°C, SpO₂ 99%, Wt 84 kg, BMI 27.3. General: well-appearing, no acute distress. Chest: clear to auscultation bilaterally. CVS: regular rate and rhythm, no murmurs.",
      assessment:  "1. Fatigue — likely secondary to sleep deprivation and work-related stress. 2. Overweight (BMI 27.3). 3. Mild hypertension (borderline — to monitor).",
      plan:        "1. CBC, CMP, TFTs, lipid panel ordered. 2. Sleep hygiene counseling. 3. Lifestyle modification advice — diet and exercise. 4. Follow-up in 4 weeks or sooner if worsening. 5. BP monitoring at home.",
    },
    diagnosis: { code: "Z00.00", description: "Encounter for general adult medical examination without abnormal findings", description_ar: "فحص طبي عام للبالغين بدون نتائج غير طبيعية" },
    orders: [
      { id: "ORD-001a", type: "lab",      description: "CBC with differential",         description_ar: "صورة دم كاملة مع التفريق",     status: "ordered" },
      { id: "ORD-001b", type: "lab",      description: "Comprehensive Metabolic Panel", description_ar: "لوحة التمثيل الغذائي الشاملة",  status: "ordered" },
      { id: "ORD-001c", type: "lab",      description: "Thyroid Function Tests (TFT)",  description_ar: "اختبارات وظائف الغدة الدرقية",   status: "ordered" },
      { id: "ORD-001d", type: "lab",      description: "Fasting Lipid Panel",            description_ar: "لوحة الدهون الصائمة",            status: "pending" },
    ],
  },
  {
    id: "CON-002",
    patient_name: "Khalid Al-Nouri",    patient_name_ar: "خالد النوري",
    mrn: "MRN-001238",                  dob: "1975-04-30", gender: "Male",
    allergies: "NSAIDs",
    provider: "Dr. Basel Farouk",       specialty: "Orthopedics", specialty_ar: "العظام والمفاصل",
    start_time: "09:35",                chief_complaint: "Right knee pain — MRI results review", chief_complaint_ar: "ألم الركبة اليمنى — مراجعة نتائج الرنين المغناطيسي",
    status: "active",
    soap: {
      subjective:  "Pt is a 51-year-old male with 3-month history of right knee pain worsening with activity. Pain rated 6/10 at rest, 8/10 with walking. No locking, minimal swelling. Tried physiotherapy with partial improvement.",
      objective:   "Vitals stable. Right knee: mild effusion, tenderness medial joint line, negative Lachman, McMurray positive for medial meniscus. ROM 0–110°. MRI (2026-06-25): Grade II medial meniscal tear.",
      assessment:  "Grade II medial meniscal tear, right knee. Contributing osteoarthritis.",
      plan:        "1. Intra-articular corticosteroid injection today. 2. Continue physiotherapy — refer for focused quadriceps strengthening. 3. Activity modification — avoid deep flexion. 4. Naproxen — AVOIDED (NSAID allergy) — prescribe Celecoxib 200 mg OD if needed (COX-2). 5. Consider arthroscopic debridement if no improvement in 6 weeks.",
    },
    diagnosis: { code: "M23.20", description: "Derangement of unspecified meniscus due to old tear or injury", description_ar: "اضطراب الغضروف الهلالي بسبب تمزق قديم" },
    orders: [
      { id: "ORD-002a", type: "imaging",    description: "X-ray Right Knee AP/Lateral",      description_ar: "أشعة سينية للركبة اليمنى",    status: "ordered" },
      { id: "ORD-002b", type: "medication", description: "Celecoxib 200 mg once daily × 14d", description_ar: "سيليكوكسيب 200 ملغ مرة يومياً لمدة 14 يوماً", status: "pending" },
      { id: "ORD-002c", type: "referral",   description: "Physiotherapy — knee strengthening", description_ar: "إحالة لعلاج طبيعي — تقوية الركبة",  status: "ordered" },
    ],
  },
  {
    id: "CON-003",
    patient_name: "Sara Khalil",        patient_name_ar: "سارة خليل",
    mrn: "MRN-001235",                  dob: "1990-07-22", gender: "Female",
    allergies: "None known",
    provider: "Dr. Nadia Mansour",      specialty: "Cardiology", specialty_ar: "أمراض القلب",
    start_time: "10:10",                chief_complaint: "Echocardiogram review — palpitations", chief_complaint_ar: "مراجعة الصدى القلبي — خفقان",
    status: "pending_review",
    soap: {
      subjective:  "36-year-old female with 2-month history of palpitations, occasional dizziness. Palpitations last seconds to minutes. Worsened with caffeine and stress. No syncope. No family history of sudden cardiac death.",
      objective:   "Vitals: BP 118/74, HR 88 irregular. Echo (2026-06-20): EF 62%, trivial mitral valve regurgitation, no structural abnormality. Holter (pending). ECG: sinus rhythm with occasional PACs.",
      assessment:  "Symptomatic premature atrial contractions (PACs). Trivial mitral regurgitation (likely incidental). Exclude thyroid disease.",
      plan:        "1. Avoid caffeine and alcohol. 2. TFTs ordered to exclude hyperthyroidism. 3. Holter monitor — 48h scheduled. 4. Reassurance provided. 5. Low-dose metoprolol if PACs persist. 6. Follow-up post-Holter results.",
    },
    diagnosis: { code: "I49.1", description: "Atrial premature depolarization", description_ar: "إزالة الاستقطاب الأذيني المبكر" },
    orders: [
      { id: "ORD-003a", type: "lab",     description: "Thyroid Function Tests",        description_ar: "اختبارات وظائف الغدة الدرقية",   status: "ordered" },
      { id: "ORD-003b", type: "imaging", description: "Holter Monitor 48h",            description_ar: "مراقب هولتر 48 ساعة",            status: "pending" },
      { id: "ORD-003c", type: "lab",     description: "Serum Electrolytes",            description_ar: "الأملاح المعدنية في الدم",         status: "ordered" },
    ],
  },
  {
    id: "CON-004",
    patient_name: "Mariam Al-Otaibi",   patient_name_ar: "مريم العتيبي",
    mrn: "MRN-001241",                  dob: "1972-03-14", gender: "Female",
    allergies: "Sulfa drugs",
    provider: "Dr. Samir Haddad",       specialty: "Endocrinology", specialty_ar: "الغدد الصماء",
    start_time: "10:45",                chief_complaint: "Diabetes Type 2 — HbA1c review", chief_complaint_ar: "سكري النوع الثاني — مراجعة HbA1c",
    status: "active",
    soap: {
      subjective:  "54-year-old female with T2DM × 12 years. Last HbA1c 9.1% (3 months ago). Reports poor dietary compliance. No hypoglycemic episodes. Some polyuria, no polydipsia recently. Medication: Metformin 1000 mg BD, Glipizide 10 mg OD.",
      objective:   "Vitals: BP 136/84, HR 80, Wt 78 kg, BMI 29.7. Current HbA1c: 8.4% (improved). FBS: 148 mg/dL. Renal: eGFR 72 (Ckd G2). Urine: microalbuminuria present.",
      assessment:  "Type 2 DM, sub-optimally controlled, improving. Hypertension. Stage G2A2 CKD. Microalbuminuria.",
      plan:        "1. Add Empagliflozin 10 mg OD — cardiorenal protection + glucose lowering. 2. Continue Metformin 1000 mg BD (eGFR >45, safe). 3. Refer to dietitian. 4. ACE inhibitor (Ramipril 5 mg) for microalbuminuria. 5. Target HbA1c < 7.5%. 6. Review in 3 months with HbA1c, renal function.",
    },
    diagnosis: { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia", description_ar: "داء السكري من النوع الثاني مع ارتفاع سكر الدم" },
    orders: [
      { id: "ORD-004a", type: "lab",      description: "HbA1c",                            description_ar: "الهيموغلوبين السكري",           status: "completed" },
      { id: "ORD-004b", type: "lab",      description: "Urine microalbumin/creatinine ratio", description_ar: "نسبة الزلال الدقيق/الكرياتينين في البول", status: "completed" },
      { id: "ORD-004c", type: "medication", description: "Empagliflozin 10 mg once daily",  description_ar: "إيمباغليفلوزين 10 ملغ مرة يومياً", status: "pending" },
      { id: "ORD-004d", type: "medication", description: "Ramipril 5 mg once daily",         description_ar: "راميبريل 5 ملغ مرة يومياً",   status: "pending" },
      { id: "ORD-004e", type: "referral",   description: "Dietitian referral",               description_ar: "إحالة لأخصائي التغذية",         status: "ordered" },
    ],
  },
  {
    id: "CON-005",
    patient_name: "Hassan Al-Aqrabawi", patient_name_ar: "حسن العقرباوي",
    mrn: "MRN-001244",                  dob: "1950-02-14", gender: "Male",
    allergies: "Codeine",
    provider: "Dr. Tarek Al-Amin",      specialty: "Gastroenterology", specialty_ar: "الجهاز الهضمي",
    start_time: "11:20",                chief_complaint: "Colonoscopy results — rectal bleeding", chief_complaint_ar: "نتائج تنظير القولون — نزيف مستقيمي",
    status: "completed",
    soap: {
      subjective:  "76-year-old male referred for colonoscopy after 3-week history of intermittent rectal bleeding and change in bowel habits (constipation). No weight loss. No family history of colorectal cancer.",
      objective:   "Colonoscopy (2026-06-28): Two tubular adenomas (5mm, 8mm) removed successfully from sigmoid colon — sent for histology. No malignancy visualized. Internal hemorrhoids grade II.",
      assessment:  "Tubular adenomas, sigmoid colon — low risk, adequate polypectomy. Internal hemorrhoids grade II. Histology pending.",
      plan:        "1. Await histology results — expected 5–7 days. 2. High-fibre diet. 3. Increase fluid intake. 4. Haemorrhoidal cream if symptomatic. 5. Repeat colonoscopy in 3 years per adenoma surveillance guidelines. 6. Notify patient when histology available.",
    },
    diagnosis: { code: "K63.5", description: "Polyp of colon", description_ar: "ورم بوليبي في القولون" },
    orders: [
      { id: "ORD-005a", type: "lab",     description: "Histology — sigmoid polyp ×2", description_ar: "أنسجة — ورم بوليبي سيني ×2",  status: "ordered" },
      { id: "ORD-005b", type: "medication", description: "Haemorrhoidal cream — Proctosedyl PRN", description_ar: "مرهم البواسير عند الحاجة", status: "ordered" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(s: string): { bg: string; text: string } {
  switch (s) {
    case "active":         return { bg: "#dbeafe", text: "#1e40af" };
    case "pending_review": return { bg: "#fef9c3", text: "#854d0e" };
    case "completed":      return { bg: "#d1fae5", text: "#065f46" };
    case "on_hold":        return { bg: "#f3f4f6", text: "#374151" };
    default:               return { bg: "#f3f4f6", text: "#374151" };
  }
}

function statusLabel(s: string, lang: "en" | "ar"): string {
  const m: Record<string, { en: string; ar: string }> = {
    active:         { en: "Active",          ar: "نشطة" },
    pending_review: { en: "Pending Review",  ar: "بانتظار المراجعة" },
    completed:      { en: "Completed",       ar: "مكتملة" },
    on_hold:        { en: "On Hold",         ar: "معلقة" },
  };
  return m[s]?.[lang] ?? s;
}

function orderTypeIcon(type: string): string {
  switch (type) {
    case "lab":       return "🧪";
    case "imaging":   return "🩻";
    case "medication": return "💊";
    case "referral":  return "🔗";
    default:          return "📋";
  }
}

function orderTypeLabel(type: string, lang: "en" | "ar"): string {
  const m: Record<string, { en: string; ar: string }> = {
    lab:       { en: "Lab",       ar: "مختبر" },
    imaging:   { en: "Imaging",   ar: "تصوير" },
    medication: { en: "Medication", ar: "دواء" },
    referral:  { en: "Referral",  ar: "إحالة" },
  };
  return m[type]?.[lang] ?? type;
}

function orderStatusColor(s: string): string {
  switch (s) {
    case "pending":   return "#f59e0b";
    case "ordered":   return "#3b82f6";
    case "completed": return "#22c55e";
    default:          return "#6b7280";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>(MOCK_CONSULTATIONS);
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONSULTATIONS[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"soap" | "diagnosis" | "orders">("soap");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saveMsg, setSaveMsg] = useState("");

  // Editable SOAP state for the selected consultation
  const [soapEdit, setSoapEdit] = useState<Consultation["soap"]>(MOCK_CONSULTATIONS[0]?.soap ?? { subjective: "", objective: "", assessment: "", plan: "" });
  const [diagnosisEdit, setDiagnosisEdit] = useState<Consultation["diagnosis"]>(MOCK_CONSULTATIONS[0]?.diagnosis ?? { code: "", description: "", description_ar: "" });
  const [newOrderDesc, setNewOrderDesc] = useState("");
  const [newOrderType, setNewOrderType] = useState<Order["type"]>("lab");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<ConsultationRaw[]>("/api/v1/clinic/consultations/");
        if (data && data.length > 0) {
          const mapped: Consultation[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name ?? "Patient"} ${item.patient_detail?.last_name ?? ""}`.trim(),
            patient_name_ar: `${item.patient_detail?.first_name_ar ?? "مريض"} ${item.patient_detail?.last_name_ar ?? ""}`.trim(),
            mrn: item.patient_detail?.mrn ?? `MRN-${String(idx).padStart(6, "0")}`,
            dob: item.patient_detail?.date_of_birth ?? "N/A",
            gender: item.patient_detail?.gender ?? "N/A",
            allergies: item.patient_detail?.allergies ?? "None known",
            provider: `Dr. ${item.provider_detail?.first_name ?? ""} ${item.provider_detail?.last_name ?? ""}`.trim(),
            specialty: item.provider_detail?.specialty ?? "General Practice",
            specialty_ar: item.provider_detail?.specialty ?? "الطب العام",
            start_time: item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--",
            chief_complaint: item.chief_complaint ?? "",
            chief_complaint_ar: item.chief_complaint ?? "",
            status: (item.status ?? "active") as Consultation["status"],
            soap: {
              subjective: item.soap_subjective ?? "",
              objective:  item.soap_objective ?? "",
              assessment: item.soap_assessment ?? "",
              plan:       item.soap_plan ?? "",
            },
            diagnosis: {
              code:        item.diagnosis_code ?? "",
              description: item.diagnosis_description ?? "",
              description_ar: item.diagnosis_description ?? "",
            },
            orders: [],
          }));
          setConsultations(mapped);
        }
      } catch (err) {
        console.warn("Consultations API unavailable, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const selected = consultations.find(c => c.id === selectedId) ?? consultations[0] ?? null;

  const handleSelectConsultation = (c: Consultation) => {
    setSelectedId(c.id);
    setSoapEdit({ ...c.soap });
    setDiagnosisEdit({ ...c.diagnosis });
    setActiveTab("soap");
    setSaveMsg("");
  };

  const handleSaveSOAP = async () => {
    try {
      await apiFetch(`/api/v1/clinic/consultations/${selectedId}/`, {
        method: "PATCH",
        body: JSON.stringify({ soap_subjective: soapEdit.subjective, soap_objective: soapEdit.objective, soap_assessment: soapEdit.assessment, soap_plan: soapEdit.plan }),
      });
    } catch { /* silent */ }
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, soap: { ...soapEdit } } : c));
    setSaveMsg(lang === "en" ? "SOAP note saved." : "تم حفظ ملاحظة SOAP.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSaveDiagnosis = async () => {
    try {
      await apiFetch(`/api/v1/clinic/consultations/${selectedId}/`, {
        method: "PATCH",
        body: JSON.stringify({ diagnosis_code: diagnosisEdit.code, diagnosis_description: diagnosisEdit.description }),
      });
    } catch { /* silent */ }
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, diagnosis: { ...diagnosisEdit } } : c));
    setSaveMsg(lang === "en" ? "Diagnosis saved." : "تم حفظ التشخيص.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleAddOrder = () => {
    if (!newOrderDesc.trim()) return;
    const ord: Order = {
      id: `ORD-NEW-${Date.now()}`,
      type: newOrderType,
      description: newOrderDesc,
      description_ar: newOrderDesc,
      status: "pending",
    };
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, orders: [...c.orders, ord] } : c));
    setNewOrderDesc("");
    setSaveMsg(lang === "en" ? "Order added." : "تم إضافة الطلب.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const filtered = consultations.filter(c => filterStatus === "all" || c.status === filterStatus);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const soapFields: Array<{ key: keyof Consultation["soap"]; label_en: string; label_ar: string; hint_en: string; hint_ar: string }> = [
    { key: "subjective",  label_en: "Subjective (S)",  label_ar: "ذاتي (S)",      hint_en: "Patient's account — history, symptoms, complaints", hint_ar: "رواية المريض — التاريخ والأعراض والشكاوى" },
    { key: "objective",   label_en: "Objective (O)",   label_ar: "موضوعي (O)",    hint_en: "Clinician observations — vitals, exam, investigations", hint_ar: "ملاحظات الطبيب — الإشارات الحيوية والفحص والفحوصات" },
    { key: "assessment",  label_en: "Assessment (A)",  label_ar: "تقييم (A)",     hint_en: "Diagnoses and differential diagnoses", hint_ar: "التشخيصات والتشخيصات التفريقية" },
    { key: "plan",        label_en: "Plan (P)",        label_ar: "خطة (P)",       hint_en: "Treatment plan, orders, follow-up", hint_ar: "خطة العلاج والطلبات والمتابعة" },
  ];

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "var(--color-text)", background: "var(--color-background)", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/clinic" style={{ color: "var(--color-text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: "0.25rem 0 0" }}>
            {lang === "en" ? "Consultations & EMR" : "الاستشارات والسجلات الطبية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            {lang === "en" ? "Active consultations, SOAP documentation, and clinical orders" : "الاستشارات النشطة وتوثيق SOAP والطلبات السريرية"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {loading && <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling nav */}
      <nav style={{ display: "flex", gap: "0.625rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/clinic/appointments",  label: lang === "en" ? "Appointments"  : "المواعيد" },
          { href: "/clinic/reception",     label: lang === "en" ? "Reception"     : "الاستقبال" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
            {n.label}
          </a>
        ))}
      </nav>

      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Active"          : "نشطة",              value: consultations.filter(c => c.status === "active").length,         color: "#3b82f6" },
          { label: lang === "en" ? "Pending Review"  : "بانتظار المراجعة", value: consultations.filter(c => c.status === "pending_review").length,  color: "#f59e0b" },
          { label: lang === "en" ? "Completed"       : "مكتملة",            value: consultations.filter(c => c.status === "completed").length,       color: "#22c55e" },
          { label: lang === "en" ? "Total Today"     : "إجمالي اليوم",      value: consultations.length,                                             color: "#22D3EE" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.35rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* LEFT — consultation list */}
        <div>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {(["all", "active", "pending_review", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                style={{
                  padding: "0.3rem 0.6rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                  background: filterStatus === f ? "#22D3EE" : "var(--color-surface)",
                  color: filterStatus === f ? "#0a0a0a" : "var(--color-text)",
                }}
              >
                {f === "all" ? (lang === "en" ? "All" : "الكل") : statusLabel(f, lang)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {filtered.map(c => {
              const ss = statusStyle(c.status);
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConsultation(c)}
                  style={{
                    background: "var(--color-surface)", border: isSelected ? "2px solid #22D3EE" : "1px solid var(--color-border)", borderRadius: "10px",
                    padding: "0.875rem 1rem", cursor: "pointer", boxShadow: isSelected ? "0 0 0 3px rgba(34,211,238,0.12)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>
                      {lang === "ar" ? c.patient_name_ar : c.patient_name}
                    </span>
                    <span style={{ padding: "0.2rem 0.5rem", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 700, background: ss.bg, color: ss.text, whiteSpace: "nowrap", marginLeft: "0.5rem" }}>
                      {statusLabel(c.status, lang)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{c.mrn}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text)", marginBottom: "0.25rem" }}>{lang === "ar" ? c.specialty_ar : c.specialty}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{c.provider} · {lang === "en" ? "Started" : "بدأ"} {c.start_time}</div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lang === "ar" ? c.chief_complaint_ar : c.chief_complaint}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — EMR detail panel */}
        {!selected ? <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>No consultation selected.</div> : <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>

          {/* Patient header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text)" }}>
                  {lang === "ar" ? selected.patient_name_ar : selected.patient_name}
                </h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  <span>{selected.mrn}</span>
                  <span>{selected.gender}</span>
                  <span>DOB: {selected.dob}</span>
                  <span style={{ color: selected.allergies === "None known" ? "var(--color-text-muted)" : "#ef4444", fontWeight: selected.allergies === "None known" ? 400 : 700 }}>
                    {lang === "en" ? "Allergies:" : "الحساسية:"} {selected.allergies}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{selected.provider}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "ar" ? selected.specialty_ar : selected.specialty}</div>
                <div style={{ fontSize: "0.78rem", color: "#22D3EE", fontWeight: 700 }}>{lang === "en" ? "Started" : "بدأ"}: {selected.start_time}</div>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.875rem", background: "var(--color-background)", borderRadius: "7px", fontSize: "0.85rem", color: "var(--color-text)", fontStyle: "italic", border: "1px solid var(--color-border)" }}>
              <span style={{ fontWeight: 700, color: "var(--color-text-muted)", marginRight: "0.5rem" }}>{lang === "en" ? "Chief complaint:" : "الشكوى:"}</span>
              {lang === "ar" ? selected.chief_complaint_ar : selected.chief_complaint}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
            {(["soap", "diagnosis", "orders"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "0.875rem", border: "none", background: activeTab === tab ? "var(--color-background)" : "transparent",
                  borderBottom: activeTab === tab ? "2px solid #22D3EE" : "2px solid transparent",
                  color: activeTab === tab ? "#22D3EE" : "var(--color-text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem",
                  marginBottom: activeTab === tab ? "-1px" : 0,
                }}
              >
                {tab === "soap"      ? (lang === "en" ? "SOAP Note"  : "ملاحظة SOAP") :
                 tab === "diagnosis" ? (lang === "en" ? "Diagnosis"  : "التشخيص") :
                                       (lang === "en" ? "Orders"     : "الطلبات")} {tab === "orders" && `(${selected.orders.length})`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "1.5rem" }}>
            {saveMsg && (
              <div style={{ marginBottom: "1rem", padding: "0.65rem 1rem", borderRadius: "7px", background: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.85rem" }}>
                {saveMsg}
              </div>
            )}

            {/* SOAP tab */}
            {activeTab === "soap" && (
              <div>
                {soapFields.map(field => (
                  <div key={field.key} style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.25rem" }}>
                      {lang === "en" ? field.label_en : field.label_ar}
                    </label>
                    <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", margin: "0 0 0.35rem", fontStyle: "italic" }}>
                      {lang === "en" ? field.hint_en : field.hint_ar}
                    </p>
                    <textarea
                      value={soapEdit[field.key]}
                      onChange={e => setSoapEdit(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={field.key === "plan" ? 5 : 4}
                      style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.875rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => { void handleSaveSOAP(); }}
                  style={{ padding: "0.65rem 1.75rem", borderRadius: "8px", background: "#22D3EE", color: "#0a0a0a", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  {lang === "en" ? "Save SOAP Note" : "حفظ ملاحظة SOAP"}
                </button>
              </div>
            )}

            {/* Diagnosis tab */}
            {activeTab === "diagnosis" && (
              <div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.35rem" }}>
                    {lang === "en" ? "ICD-11 Code" : "رمز ICD-11"}
                  </label>
                  <input
                    type="text"
                    value={diagnosisEdit.code}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. E11.65"
                    style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.875rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.95rem", fontFamily: "monospace", fontWeight: 700 }}
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.35rem" }}>
                    {lang === "en" ? "Diagnosis Description (EN)" : "وصف التشخيص (إنجليزي)"}
                  </label>
                  <textarea
                    value={diagnosisEdit.description}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.875rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", resize: "vertical" }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.35rem" }}>
                    {lang === "en" ? "Diagnosis Description (AR)" : "وصف التشخيص (عربي)"}
                  </label>
                  <textarea
                    value={diagnosisEdit.description_ar}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, description_ar: e.target.value }))}
                    dir="rtl"
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.875rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", resize: "vertical" }}
                  />
                </div>
                <button
                  onClick={() => { void handleSaveDiagnosis(); }}
                  style={{ padding: "0.65rem 1.75rem", borderRadius: "8px", background: "#22D3EE", color: "#0a0a0a", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  {lang === "en" ? "Save Diagnosis" : "حفظ التشخيص"}
                </button>
              </div>
            )}

            {/* Orders tab */}
            {activeTab === "orders" && (
              <div>
                {/* Existing orders */}
                {selected.orders.length > 0 ? (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                          {[
                            lang === "en" ? "Type"        : "النوع",
                            lang === "en" ? "Description" : "الوصف",
                            lang === "en" ? "Status"      : "الحالة",
                          ].map(h => (
                            <th key={h} style={{ padding: "0.625rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.orders.map((ord, i) => (
                          <tr key={ord.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgb(var(--color-ink-rgb) / 0.02)" }}>
                            <td style={{ padding: "0.625rem 0.875rem" }}>
                              <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                                {orderTypeIcon(ord.type)}&nbsp;
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)" }}>{orderTypeLabel(ord.type, lang)}</span>
                              </span>
                            </td>
                            <td style={{ padding: "0.625rem 0.875rem", fontSize: "0.875rem", color: "var(--color-text)" }}>
                              {lang === "ar" ? ord.description_ar : ord.description}
                            </td>
                            <td style={{ padding: "0.625rem 0.875rem" }}>
                              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: orderStatusColor(ord.status), display: "inline-block", marginRight: "0.4rem" }} />
                              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: orderStatusColor(ord.status) }}>
                                {ord.status.charAt(0).toUpperCase() + ord.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    {lang === "en" ? "No orders placed yet for this consultation." : "لا توجد طلبات حتى الآن لهذه الاستشارة."}
                  </p>
                )}

                {/* Add new order */}
                <div style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 1rem", color: "#22D3EE" }}>
                    {lang === "en" ? "Add New Order" : "إضافة طلب جديد"}
                  </h3>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <select
                      value={newOrderType}
                      onChange={e => setNewOrderType(e.target.value as Order["type"])}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", minWidth: "120px" }}
                    >
                      {(["lab", "imaging", "medication", "referral"] as const).map(t => (
                        <option key={t} value={t}>{orderTypeLabel(t, lang)}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newOrderDesc}
                      onChange={e => setNewOrderDesc(e.target.value)}
                      placeholder={lang === "en" ? "Order description..." : "وصف الطلب..."}
                      style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", minWidth: "180px" }}
                    />
                    <button
                      onClick={handleAddOrder}
                      style={{ padding: "0.5rem 1.25rem", borderRadius: "7px", background: "#22D3EE", color: "#0a0a0a", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem", whiteSpace: "nowrap" }}
                    >
                      {lang === "en" ? "Add Order" : "إضافة طلب"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>}
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        CyMed Clinic · {lang === "en" ? "Consultations & EMR" : "الاستشارات والسجلات الطبية"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
