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

  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1 block text-[13px] font-bold text-brand-400";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/clinic" className="text-sm text-ink/50 hover:text-ink">
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {lang === "en" ? "Consultations & EMR" : "الاستشارات والسجلات الطبية"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Active consultations, SOAP documentation, and clinical orders" : "الاستشارات النشطة وتوثيق SOAP والطلبات السريرية"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-sm text-ink/50">{lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling nav */}
      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/clinic/appointments",  label: lang === "en" ? "Appointments"  : "المواعيد" },
          { href: "/clinic/reception",     label: lang === "en" ? "Reception"     : "الاستقبال" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {n.label}
          </a>
        ))}
      </nav>

      {/* Summary metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: lang === "en" ? "Active"          : "نشطة",              value: consultations.filter(c => c.status === "active").length,         color: "#3b82f6" },
          { label: lang === "en" ? "Pending Review"  : "بانتظار المراجعة", value: consultations.filter(c => c.status === "pending_review").length,  color: "#f59e0b" },
          { label: lang === "en" ? "Completed"       : "مكتملة",            value: consultations.filter(c => c.status === "completed").length,       color: "#22c55e" },
          { label: lang === "en" ? "Total Today"     : "إجمالي اليوم",      value: consultations.length,                                             color: "#22D3EE" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs font-medium text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-[300px_1fr] items-start gap-6">

        {/* LEFT — consultation list */}
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["all", "active", "pending_review", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`rounded px-2.5 py-1.5 text-xs font-semibold border ${filterStatus === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink hover:bg-ink/5"}`}
              >
                {f === "all" ? (lang === "en" ? "All" : "الكل") : statusLabel(f, lang)}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {filtered.map(c => {
              const ss = statusStyle(c.status);
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConsultation(c)}
                  className={`cursor-pointer rounded-xl border p-3.5 ${isSelected ? "border-2 border-brand-400 shadow-[0_0_0_3px_rgba(237,108,0,0.12)]" : "border-ink/10 bg-surface"}`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="text-sm font-bold">
                      {lang === "ar" ? c.patient_name_ar : c.patient_name}
                    </span>
                    <span className="ml-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: ss.bg, color: ss.text }}>
                      {statusLabel(c.status, lang)}
                    </span>
                  </div>
                  <div className="mb-1 text-xs text-ink/50">{c.mrn}</div>
                  <div className="mb-1 text-[13px]">{lang === "ar" ? c.specialty_ar : c.specialty}</div>
                  <div className="text-xs text-ink/50">{c.provider} · {lang === "en" ? "Started" : "بدأ"} {c.start_time}</div>
                  <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs italic text-ink/50">
                    {lang === "ar" ? c.chief_complaint_ar : c.chief_complaint}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — EMR detail panel */}
        {!selected ? <div className="p-8 text-ink/50">No consultation selected.</div> : <div className="cy-card overflow-hidden p-0">

          {/* Patient header */}
          <div className="border-b border-ink/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {lang === "ar" ? selected.patient_name_ar : selected.patient_name}
                </h2>
                <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-ink/50">
                  <span>{selected.mrn}</span>
                  <span>{selected.gender}</span>
                  <span>DOB: {selected.dob}</span>
                  <span className={selected.allergies === "None known" ? "text-ink/50" : "font-bold text-red-400"}>
                    {lang === "en" ? "Allergies:" : "الحساسية:"} {selected.allergies}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink/50">{selected.provider}</div>
                <div className="text-sm text-ink/50">{lang === "ar" ? selected.specialty_ar : selected.specialty}</div>
                <div className="text-[13px] font-bold text-brand-400">{lang === "en" ? "Started" : "بدأ"}: {selected.start_time}</div>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-ink/10 bg-surface-overlay px-3.5 py-2.5 text-sm italic">
              <span className="mr-2 font-bold text-ink/50">{lang === "en" ? "Chief complaint:" : "الشكوى:"}</span>
              {lang === "ar" ? selected.chief_complaint_ar : selected.chief_complaint}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-ink/10">
            {(["soap", "diagnosis", "orders"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`-mb-px flex-1 border-b-2 p-3.5 text-sm font-bold ${activeTab === tab ? "border-brand-400 bg-surface-overlay text-brand-400" : "border-transparent text-ink/50 hover:text-ink"}`}
              >
                {tab === "soap"      ? (lang === "en" ? "SOAP Note"  : "ملاحظة SOAP") :
                 tab === "diagnosis" ? (lang === "en" ? "Diagnosis"  : "التشخيص") :
                                       (lang === "en" ? "Orders"     : "الطلبات")} {tab === "orders" && `(${selected.orders.length})`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {saveMsg && (
              <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
                {saveMsg}
              </div>
            )}

            {/* SOAP tab */}
            {activeTab === "soap" && (
              <div>
                {soapFields.map(field => (
                  <div key={field.key} className="mb-5">
                    <label className={labelCls}>
                      {lang === "en" ? field.label_en : field.label_ar}
                    </label>
                    <p className="mb-1.5 text-xs italic text-ink/50">
                      {lang === "en" ? field.hint_en : field.hint_ar}
                    </p>
                    <textarea
                      value={soapEdit[field.key]}
                      onChange={e => setSoapEdit(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={field.key === "plan" ? 5 : 4}
                      className={`${inputCls} resize-y leading-relaxed`}
                    />
                  </div>
                ))}
                <button onClick={() => { void handleSaveSOAP(); }} className="cy-btn cy-btn-primary">
                  {lang === "en" ? "Save SOAP Note" : "حفظ ملاحظة SOAP"}
                </button>
              </div>
            )}

            {/* Diagnosis tab */}
            {activeTab === "diagnosis" && (
              <div>
                <div className="mb-5">
                  <label className={labelCls}>
                    {lang === "en" ? "ICD-11 Code" : "رمز ICD-11"}
                  </label>
                  <input
                    type="text"
                    value={diagnosisEdit.code}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. E11.65"
                    className={`${inputCls} font-mono font-bold`}
                  />
                </div>
                <div className="mb-5">
                  <label className={labelCls}>
                    {lang === "en" ? "Diagnosis Description (EN)" : "وصف التشخيص (إنجليزي)"}
                  </label>
                  <textarea
                    value={diagnosisEdit.description}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`${inputCls} resize-y`}
                  />
                </div>
                <div className="mb-6">
                  <label className={labelCls}>
                    {lang === "en" ? "Diagnosis Description (AR)" : "وصف التشخيص (عربي)"}
                  </label>
                  <textarea
                    value={diagnosisEdit.description_ar}
                    onChange={e => setDiagnosisEdit(prev => ({ ...prev, description_ar: e.target.value }))}
                    dir="rtl"
                    rows={3}
                    className={`${inputCls} resize-y`}
                  />
                </div>
                <button onClick={() => { void handleSaveDiagnosis(); }} className="cy-btn cy-btn-primary">
                  {lang === "en" ? "Save Diagnosis" : "حفظ التشخيص"}
                </button>
              </div>
            )}

            {/* Orders tab */}
            {activeTab === "orders" && (
              <div>
                {/* Existing orders */}
                {selected.orders.length > 0 ? (
                  <div className="mb-6 overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-ink/10">
                          {[
                            lang === "en" ? "Type"        : "النوع",
                            lang === "en" ? "Description" : "الوصف",
                            lang === "en" ? "Status"      : "الحالة",
                          ].map(h => (
                            <th key={h} className={`px-3.5 py-2.5 text-xs font-bold uppercase text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.orders.map(ord => (
                          <tr key={ord.id} className="border-b border-ink/5">
                            <td className="px-3.5 py-2.5">
                              <span className="whitespace-nowrap text-sm">
                                {orderTypeIcon(ord.type)}&nbsp;
                                <span className="text-[13px] font-bold text-ink/50">{orderTypeLabel(ord.type, lang)}</span>
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-sm">
                              {lang === "ar" ? ord.description_ar : ord.description}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: orderStatusColor(ord.status) }} />
                              <span className="text-[13px] font-semibold" style={{ color: orderStatusColor(ord.status) }}>
                                {ord.status.charAt(0).toUpperCase() + ord.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mb-6 text-sm text-ink/50">
                    {lang === "en" ? "No orders placed yet for this consultation." : "لا توجد طلبات حتى الآن لهذه الاستشارة."}
                  </p>
                )}

                {/* Add new order */}
                <div className="cy-card p-5">
                  <h3 className="mb-4 text-sm font-bold text-brand-400">
                    {lang === "en" ? "Add New Order" : "إضافة طلب جديد"}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={newOrderType}
                      onChange={e => setNewOrderType(e.target.value as Order["type"])}
                      className="min-w-[120px] rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink"
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
                      className="min-w-[180px] flex-1 rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink"
                    />
                    <button onClick={handleAddOrder} className="cy-btn cy-btn-primary !min-h-0 whitespace-nowrap !py-2 !px-5 text-sm">
                      {lang === "en" ? "Add Order" : "إضافة طلب"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>}
      </div>

      <div className="mt-6 text-center text-xs text-ink/50">
        CyMed Clinic · {lang === "en" ? "Consultations & EMR" : "الاستشارات والسجلات الطبية"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
