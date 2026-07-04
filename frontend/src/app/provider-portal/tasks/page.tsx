"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type TaskPriority = "urgent" | "routine";
type TaskStatus = "pending" | "in-progress" | "completed" | "deferred" | "delegated";
type TaskType = "sign-result" | "review-note" | "authorize-refill" | "complete-referral" | "co-sign-order";

interface ClinicalTask {
  id: string;
  type: TaskType;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  description: string;
  description_ar: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  assigned_to: string;
}

const TASKS: ClinicalTask[] = [
  { id: "TSK-001", type: "sign-result", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", description: "Sign HbA1c result (9.8%) — Critical High", description_ar: "توقيع نتيجة هيموجلوبين سكري (9.8%) — حرج عالٍ", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-002", type: "sign-result", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", description: "Sign Creatinine result (3.2 mg/dL) — Critical High", description_ar: "توقيع نتيجة الكرياتينين (3.2 مجم/دل) — حرج عالٍ", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-003", type: "review-note", patient_name: "Khalid Al-Zahrani", patient_name_ar: "خالد الزهراني", mrn: "MRN-003", description: "Review and finalize discharge summary — Cardiology", description_ar: "مراجعة وإنهاء ملخص الخروج — أمراض القلب", priority: "urgent", due_date: "2026-06-30", status: "in-progress", assigned_to: "Dr. Hassan" },
  { id: "TSK-004", type: "authorize-refill", patient_name: "Mariam Al-Harbi", patient_name_ar: "مريم الحربي", mrn: "MRN-002", description: "Authorize refill: Amlodipine 5mg × 3 months", description_ar: "تفويض إعادة صرف: أملوديبين 5 مجم × 3 أشهر", priority: "routine", due_date: "2026-07-02", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-005", type: "complete-referral", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", description: "Complete nephrology referral letter — CKD Stage 3b", description_ar: "إتمام خطاب إحالة كلى — مرض الكلى المزمن مرحلة 3ب", priority: "routine", due_date: "2026-07-01", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-006", type: "co-sign-order", patient_name: "Abdulaziz Al-Dossari", patient_name_ar: "عبدالعزيز الدوسري", mrn: "MRN-007", description: "Co-sign oxygen therapy order — COPD exacerbation", description_ar: "توقيع مشترك لأمر العلاج بالأكسجين — تفاقم مرض الانسداد", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-007", type: "sign-result", patient_name: "Majed Al-Otaibi", patient_name_ar: "ماجد العتيبي", mrn: "MRN-009", description: "Sign Echocardiogram — LVEF 28%, Dilated cardiomyopathy", description_ar: "توقيع صدى القلب — LVEF 28%، اعتلال عضلة القلب التوسعي", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-008", type: "authorize-refill", patient_name: "Saud Al-Bishi", patient_name_ar: "سعود البيشي", mrn: "MRN-011", description: "Authorize refill: Apixaban 5mg — INR follow-up required", description_ar: "تفويض إعادة صرف: أبيكسابان 5 مجم — يلزم متابعة INR", priority: "routine", due_date: "2026-07-03", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-009", type: "review-note", patient_name: "Sara Al-Mutairi", patient_name_ar: "سارة المطيري", mrn: "MRN-008", description: "Review rheumatology consult note — biologic therapy approval", description_ar: "مراجعة ملاحظة استشارة الروماتولوجيا — الموافقة على العلاج البيولوجي", priority: "routine", due_date: "2026-07-05", status: "deferred", assigned_to: "Dr. Hassan" },
  { id: "TSK-010", type: "sign-result", patient_name: "Waleed Al-Subaie", patient_name_ar: "وليد السبيعي", mrn: "MRN-019", description: "Sign PSA result (12.4 ng/mL) — requires urology referral discussion", description_ar: "توقيع نتيجة PSA (12.4 نانوغرام/مل) — يتطلب نقاش إحالة بولية", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-011", type: "authorize-refill", patient_name: "Turki Al-Fahad", patient_name_ar: "تركي الفهد", mrn: "MRN-013", description: "Authorize refill: Metformin 1000mg + Lisinopril 10mg", description_ar: "تفويض إعادة صرف: ميتفورمين + ليزينوبريل", priority: "routine", due_date: "2026-07-04", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-012", type: "complete-referral", patient_name: "Faisal Al-Jabri", patient_name_ar: "فيصل الجابري", mrn: "MRN-015", description: "Complete neurology referral — Parkinson's medication titration", description_ar: "إتمام إحالة الأعصاب — ضبط جرعة أدوية باركنسون", priority: "routine", due_date: "2026-07-07", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-013", type: "sign-result", patient_name: "Dalal Al-Subhi", patient_name_ar: "دلال الصبحي", mrn: "MRN-016", description: "Sign Anti-dsDNA (1:640) — SLE flare workup required", description_ar: "توقيع نتيجة Anti-dsDNA (1:640) — يلزم تقييم نشاط الذئبة", priority: "urgent", due_date: "2026-06-30", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-014", type: "review-note", patient_name: "Abeer Al-Nasser", patient_name_ar: "عبير الناصر", mrn: "MRN-020", description: "Review oncology follow-up note — Breast cancer remission", description_ar: "مراجعة ملاحظة المتابعة الأورامية — هدأة سرطان الثدي", priority: "routine", due_date: "2026-07-06", status: "completed", assigned_to: "Dr. Hassan" },
  { id: "TSK-015", type: "co-sign-order", patient_name: "Hessa Al-Anazi", patient_name_ar: "حصة العنزي", mrn: "MRN-010", description: "Co-sign IV iron infusion order — severe iron deficiency", description_ar: "توقيع مشترك لأمر ضخ الحديد الوريدي — نقص حديد حاد", priority: "urgent", due_date: "2026-06-30", status: "in-progress", assigned_to: "Dr. Hassan" },
  { id: "TSK-016", type: "authorize-refill", patient_name: "Noura Al-Shehri", patient_name_ar: "نورة الشهري", mrn: "MRN-006", description: "Authorize refill: Levothyroxine 75mcg × 6 months", description_ar: "تفويض إعادة صرف: ليفوثيروكسين 75 ميكروغرام × 6 أشهر", priority: "routine", due_date: "2026-07-10", status: "delegated", assigned_to: "Dr. Aisha (resident)" },
  { id: "TSK-017", type: "complete-referral", patient_name: "Manal Al-Sulami", patient_name_ar: "منال السلمي", mrn: "MRN-014", description: "Complete bone density referral — T-score -2.8 (Osteoporosis)", description_ar: "إتمام إحالة كثافة العظام — T-score -2.8 (هشاشة العظام)", priority: "routine", due_date: "2026-07-08", status: "pending", assigned_to: "Dr. Hassan" },
  { id: "TSK-018", type: "review-note", patient_name: "Lujain Al-Shamrani", patient_name_ar: "لجين الشمراني", mrn: "MRN-018", description: "Review PCOS management plan — OCP initiation", description_ar: "مراجعة خطة علاج متلازمة المبيض المتعدد الكيسات — بدء حبوب منع الحمل", priority: "routine", due_date: "2026-07-09", status: "pending", assigned_to: "Dr. Hassan" },
];

const TYPE_LABELS: Record<TaskType, { en: string; ar: string }> = {
  "sign-result": { en: "Sign Result", ar: "توقيع نتيجة" },
  "review-note": { en: "Review Note", ar: "مراجعة ملاحظة" },
  "authorize-refill": { en: "Authorize Refill", ar: "تفويض إعادة صرف" },
  "complete-referral": { en: "Complete Referral", ar: "إتمام إحالة" },
  "co-sign-order": { en: "Co-sign Order", ar: "توقيع مشترك" },
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: "#f59e0b",
  "in-progress": "#3b82f6",
  completed: "#22c55e",
  deferred: "#94a3b8",
  delegated: "#a855f7",
};

export default function ProviderTasks() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [tasks, setTasks] = useState<ClinicalTask[]>(TASKS);
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await apiFetch<ClinicalTask[]>("/api/v1/provider-portal/tasks/");
        if (data && Array.isArray(data) && data.length > 0) setTasks(data);
      } catch (err) {
        console.warn("Provider tasks API unavailable, using mock data:", err);
      }
    }
    void fetchTasks();
  }, []);

  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const pendingCount = tasks.filter(t => t.status === "pending" || t.status === "in-progress").length;
  const urgentCount = tasks.filter(t => t.priority === "urgent" && (t.status === "pending" || t.status === "in-progress")).length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  const filtered = tasks.filter(t => {
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchPriority && matchStatus;
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/provider-portal" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "0.5rem" }}>
            {lang === "en" ? "← Provider Portal" : "→ بوابة الطبيب"}
          </a>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {lang === "en" ? "Clinical Tasks" : "المهام السريرية"}
            {urgentCount > 0 && (
              <span style={{ fontSize: "1rem", fontWeight: 700, background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "0.15rem 0.6rem" }}>{urgentCount} {lang === "en" ? "urgent" : "عاجل"}</span>
            )}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Pending actions — sign, review, authorize, co-sign, complete" : "الإجراءات المعلقة — توقيع، مراجعة، تفويض، توقيع مشترك، إتمام"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Total Tasks" : "إجمالي المهام", value: tasks.length, color: "#22D3EE" },
          { label: lang === "en" ? "Pending / In-Progress" : "معلقة / جارية", value: pendingCount, color: "#f59e0b" },
          { label: lang === "en" ? "Urgent" : "عاجلة", value: urgentCount, color: "#ef4444" },
          { label: lang === "en" ? "Completed" : "مكتملة", value: completedCount, color: "#22c55e" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color, marginTop: "0.25rem" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "urgent", "routine"] as const).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} style={{ padding: "0.4rem 0.875rem", borderRadius: "8px", border: `1px solid ${priorityFilter === p ? "#22D3EE" : "var(--color-border)"}`, background: priorityFilter === p ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: priorityFilter === p ? "#22D3EE" : "var(--color-text)", fontSize: "0.8125rem", cursor: "pointer", fontWeight: priorityFilter === p ? 600 : 400 }}>
              {p === "all" ? (lang === "en" ? "All" : "الكل") : p === "urgent" ? (lang === "en" ? "Urgent" : "عاجل") : (lang === "en" ? "Routine" : "روتيني")}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "pending", "in-progress", "completed", "deferred", "delegated"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "0.4rem 0.875rem", borderRadius: "8px", border: `1px solid ${statusFilter === s ? STATUS_COLOR[s as TaskStatus] ?? "var(--color-border)" : "var(--color-border)"}`, background: statusFilter === s ? `${STATUS_COLOR[s as TaskStatus] ?? "transparent"}20` : "var(--color-surface)", color: statusFilter === s ? (STATUS_COLOR[s as TaskStatus] ?? "var(--color-text)") : "var(--color-text)", fontSize: "0.8125rem", cursor: "pointer", fontWeight: statusFilter === s ? 600 : 400 }}>
              {s === "all" ? (lang === "en" ? "All Status" : "جميع الحالات") : lang === "en" ? s.replace("-", " ") : s === "pending" ? "معلقة" : s === "in-progress" ? "جارية" : s === "completed" ? "مكتملة" : s === "deferred" ? "مؤجلة" : "مفوضة"}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map(task => (
          <div key={task.id} style={{ background: "var(--color-surface)", border: `1px solid ${task.priority === "urgent" && task.status === "pending" ? "#ef4444" : "var(--color-border)"}`, borderRadius: "12px", padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{task.id}</span>
                  <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, background: "rgba(34,211,238,0.1)", color: "#22D3EE" }}>
                    {TYPE_LABELS[task.type][lang]}
                  </span>
                  {task.priority === "urgent" && (
                    <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(239,68,68,0.12)", color: "#ef4444", textTransform: "uppercase" }}>
                      {lang === "en" ? "URGENT" : "عاجل"}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.375rem" }}>
                  {lang === "en" ? task.description : task.description_ar}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  {lang === "en" ? task.patient_name : task.patient_name_ar} · {task.mrn} · {lang === "en" ? `Due: ${task.due_date}` : `الاستحقاق: ${task.due_date}`} · {lang === "en" ? `Assigned to: ${task.assigned_to}` : `مكلف: ${task.assigned_to}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600, background: `${STATUS_COLOR[task.status]}20`, color: STATUS_COLOR[task.status], textTransform: "capitalize", whiteSpace: "nowrap" }}>
                  {lang === "en" ? task.status.replace("-", " ") : task.status === "pending" ? "معلقة" : task.status === "in-progress" ? "جارية" : task.status === "completed" ? "مكتملة" : task.status === "deferred" ? "مؤجلة" : "مفوضة"}
                </span>
                {(task.status === "pending" || task.status === "in-progress") && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => updateStatus(task.id, "completed")} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                      {lang === "en" ? "Complete" : "إتمام"}
                    </button>
                    <button onClick={() => updateStatus(task.id, "delegated")} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #a855f7", background: "transparent", color: "#a855f7", cursor: "pointer", fontWeight: 500 }}>
                      {lang === "en" ? "Delegate" : "تفويض"}
                    </button>
                    <button onClick={() => updateStatus(task.id, "deferred")} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer", fontWeight: 500 }}>
                      {lang === "en" ? "Defer" : "تأجيل"}
                    </button>
                  </div>
                )}
                {task.status === "completed" && (
                  <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 700 }}>✓ {lang === "en" ? "Done" : "تم"}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
            {lang === "en" ? "No tasks match the selected filters." : "لا توجد مهام تطابق الفلتر المحدد."}
          </div>
        )}
      </div>
    </div>
  );
}
