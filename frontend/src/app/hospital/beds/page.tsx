"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

type BedStatus = "available" | "occupied" | "cleaning" | "maintenance";

interface Bed {
  id: string;
  number: string;
  status: BedStatus;
  patient_name?: string;
  patient_name_ar?: string;
  patient_mrn?: string;
  hours_occupied?: number;
}

interface Ward {
  id: string;
  name: string;
  name_ar: string;
  beds: Bed[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function makeBeds(prefix: string, count: number, occupied: number[], cleaning: number[], maintenance: number[], patients: { name: string; name_ar: string; mrn: string; hours: number }[]): Bed[] {
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1;
    const id = `${prefix}-${String(num).padStart(2, "0")}`;
    const label = `${prefix}-${num}`;
    if (maintenance.includes(num)) return { id, number: label, status: "maintenance" };
    if (cleaning.includes(num)) return { id, number: label, status: "cleaning" };
    const occIdx = occupied.indexOf(num);
    if (occIdx !== -1 && patients[occIdx]) {
      const p = patients[occIdx];
      return { id, number: label, status: "occupied", patient_name: p.name, patient_name_ar: p.name_ar, patient_mrn: p.mrn, hours_occupied: p.hours };
    }
    return { id, number: label, status: "available" };
  });
}

const MOCK_WARDS: Ward[] = [
  {
    id: "W01", name: "Medical Ward A", name_ar: "جناح طبي أ",
    beds: makeBeds("A", 12, [1,2,3,4,5,6,7,8,9,10], [11], [12],
      [
        { name: "Ahmad Al-Rashidi", name_ar: "أحمد الراشدي", mrn: "MRN-10042", hours: 48 },
        { name: "Noura Al-Ghamdi", name_ar: "نورة الغامدي", mrn: "MRN-10162", hours: 6 },
        { name: "Khalid Bin Saad", name_ar: "خالد بن سعد", mrn: "MRN-10077", hours: 72 },
        { name: "Layla Al-Amer", name_ar: "ليلى العامر", mrn: "MRN-10093", hours: 24 },
        { name: "Omar Al-Farsi", name_ar: "عمر الفارسي", mrn: "MRN-10128", hours: 36 },
        { name: "Hind Al-Hajri", name_ar: "هند الحجري", mrn: "MRN-10144", hours: 12 },
        { name: "Saad Al-Bishi", name_ar: "سعد البيشي", mrn: "MRN-10159", hours: 96 },
        { name: "Mona Al-Harbi", name_ar: "منى الحربي", mrn: "MRN-10171", hours: 8 },
        { name: "Faris Al-Qahtani", name_ar: "فارس القحطاني", mrn: "MRN-10185", hours: 60 },
        { name: "Reem Al-Otaibi", name_ar: "ريم العتيبي", mrn: "MRN-10198", hours: 18 },
      ])
  },
  {
    id: "W02", name: "Surgical Ward B", name_ar: "جناح جراحي ب",
    beds: makeBeds("B", 10, [1,2,3,4,5,6,7,8], [9], [10],
      [
        { name: "Mohammed Al-Sayed", name_ar: "محمد السيد", mrn: "MRN-10103", hours: 14 },
        { name: "Sara Al-Mukhtar", name_ar: "سارة المختار", mrn: "MRN-10114", hours: 20 },
        { name: "Ibrahim Al-Shammari", name_ar: "إبراهيم الشمري", mrn: "MRN-09812", hours: 32 },
        { name: "Amal Bin Nasser", name_ar: "أمل بن ناصر", mrn: "MRN-09831", hours: 48 },
        { name: "Walid Al-Ghamdi", name_ar: "وليد الغامدي", mrn: "MRN-09847", hours: 10 },
        { name: "Duaa Al-Harbi", name_ar: "دعاء الحربي", mrn: "MRN-09863", hours: 24 },
        { name: "Yazid Al-Rasheed", name_ar: "يزيد الرشيد", mrn: "MRN-09878", hours: 36 },
        { name: "Ghada Al-Zahrani", name_ar: "غادة الزهراني", mrn: "MRN-09892", hours: 8 },
      ])
  },
  {
    id: "W03", name: "ICU", name_ar: "وحدة العناية المركزة",
    beds: makeBeds("ICU", 8, [1,2,3,4,5,6], [7], [8],
      [
        { name: "Salem Al-Shehri", name_ar: "سالم الشهري", mrn: "MRN-09901", hours: 120 },
        { name: "Hanan Al-Otaibi", name_ar: "حنان العتيبي", mrn: "MRN-10135", hours: 96 },
        { name: "Nasser Al-Dosari", name_ar: "ناصر الدوسري", mrn: "MRN-10202", hours: 72 },
        { name: "Zainab Al-Ali", name_ar: "زينب العلي", mrn: "MRN-10217", hours: 48 },
        { name: "Turki Al-Anzi", name_ar: "تركي العنزي", mrn: "MRN-10231", hours: 36 },
        { name: "Maryam Al-Balushi", name_ar: "مريم البلوشي", mrn: "MRN-09956", hours: 24 },
      ])
  },
  {
    id: "W04", name: "Maternity Ward", name_ar: "جناح الولادة",
    beds: makeBeds("M", 9, [1,2,3,4,5,6,7], [8], [],
      [
        { name: "Fatima Al-Zahra", name_ar: "فاطمة الزهراء", mrn: "MRN-10089", hours: 6 },
        { name: "Rania Al-Khatib", name_ar: "رانيا الخطيب", mrn: "MRN-10244", hours: 12 },
        { name: "Asma Al-Hajj", name_ar: "أسماء الحاج", mrn: "MRN-10258", hours: 24 },
        { name: "Nadia Al-Badri", name_ar: "نادية البدري", mrn: "MRN-10269", hours: 36 },
        { name: "Suha Al-Mansouri", name_ar: "سهى المنصوري", mrn: "MRN-10281", hours: 48 },
        { name: "Rana Al-Harbi", name_ar: "رنا الحربي", mrn: "MRN-10293", hours: 10 },
        { name: "Maha Al-Saidi", name_ar: "مها السعيدي", mrn: "MRN-10307", hours: 18 },
      ])
  },
  {
    id: "W05", name: "Pediatrics", name_ar: "طب الأطفال",
    beds: makeBeds("PD", 10, [1,2,3,4,5,6], [], [10],
      [
        { name: "Ali Hassan (4y)", name_ar: "علي حسن (4 سنوات)", mrn: "MRN-10319", hours: 24 },
        { name: "Jood Al-Amer (7y)", name_ar: "جود العامر (7 سنوات)", mrn: "MRN-10328", hours: 48 },
        { name: "Tariq Al-Bakri (2y)", name_ar: "طارق البكري (2 سنوات)", mrn: "MRN-10341", hours: 12 },
        { name: "Lina Al-Saeed (5y)", name_ar: "لينا السعيد (5 سنوات)", mrn: "MRN-10354", hours: 36 },
        { name: "Hamza Bin Ali (9y)", name_ar: "حمزة بن علي (9 سنوات)", mrn: "MRN-10367", hours: 8 },
        { name: "Noor Al-Farsi (3y)", name_ar: "نور الفارسي (3 سنوات)", mrn: "MRN-10379", hours: 20 },
      ])
  },
  {
    id: "W06", name: "Emergency Obs", name_ar: "طوارئ المراقبة",
    beds: makeBeds("EMG", 6, [1,2,3,4,5,6], [], [],
      [
        { name: "Rania Al-Oteibi", name_ar: "رانيا العتيبي", mrn: "MRN-09845", hours: 4 },
        { name: "Basel Al-Shafie", name_ar: "باسل الشافعي", mrn: "MRN-10388", hours: 6 },
        { name: "Samira Al-Wadi", name_ar: "سميرة الوادي", mrn: "MRN-10399", hours: 8 },
        { name: "Fahad Al-Mutairi", name_ar: "فهد المطيري", mrn: "MRN-10411", hours: 2 },
        { name: "Hessa Al-Dosari", name_ar: "حصة الدوسري", mrn: "MRN-10422", hours: 3 },
        { name: "Wael Al-Shehri", name_ar: "وائل الشهري", mrn: "MRN-10434", hours: 5 },
      ])
  },
  {
    id: "W07", name: "Orthopedics", name_ar: "العظام",
    beds: makeBeds("ORT", 8, [1,2,3,4,5,6], [7], [8],
      [
        { name: "Yousef Al-Harbi", name_ar: "يوسف الحربي", mrn: "MRN-10147", hours: 10 },
        { name: "Dalal Al-Qahtani", name_ar: "دلال القحطاني", mrn: "MRN-10446", hours: 72 },
        { name: "Mansour Al-Ruwaili", name_ar: "منصور الرويلي", mrn: "MRN-10457", hours: 48 },
        { name: "Reem Bin Laden", name_ar: "ريم بن لادن", mrn: "MRN-10468", hours: 36 },
        { name: "Saeed Al-Marri", name_ar: "سعيد المري", mrn: "MRN-10479", hours: 24 },
        { name: "Khawla Al-Amer", name_ar: "خولة العامر", mrn: "MRN-10492", hours: 60 },
      ])
  },
  {
    id: "W08", name: "Oncology", name_ar: "الأورام",
    beds: makeBeds("ONC", 8, [1,2,3,4,5,6,7], [], [8],
      [
        { name: "Hanan Al-Otaibi", name_ar: "حنان العتيبي", mrn: "MRN-10135", hours: 14 },
        { name: "Abdul Aziz Al-Saud", name_ar: "عبدالعزيز آل سعود", mrn: "MRN-10503", hours: 72 },
        { name: "Umm Kulthoom", name_ar: "أم كلثوم", mrn: "MRN-10514", hours: 96 },
        { name: "Jassim Al-Balooshi", name_ar: "جاسم البلوشي", mrn: "MRN-10526", hours: 48 },
        { name: "Bushra Al-Bakr", name_ar: "بشرى البكر", mrn: "MRN-10537", hours: 36 },
        { name: "Mahir Al-Jassim", name_ar: "ماهر الجاسم", mrn: "MRN-10549", hours: 24 },
        { name: "Faten Al-Rashid", name_ar: "فاطن الرشيد", mrn: "MRN-10561", hours: 12 },
      ])
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BED_COLORS: Record<BedStatus, { bg: string; border: string; text: string }> = {
  available: { bg: "#052e16", border: "#22c55e", text: "#22c55e" },
  occupied: { bg: "#1e1b4b", border: "#6366f1", text: "#a5b4fc" },
  cleaning: { bg: "#1c1917", border: "#f59e0b", text: "#fbbf24" },
  maintenance: { bg: "#1f1f1f", border: "#6b7280", text: "#9ca3af" },
};

function wardSummary(beds: Bed[]) {
  return {
    total: beds.length,
    available: beds.filter(b => b.status === "available").length,
    occupied: beds.filter(b => b.status === "occupied").length,
    cleaning: beds.filter(b => b.status === "cleaning").length,
    maintenance: beds.filter(b => b.status === "maintenance").length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BedsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
  const [loading, setLoading] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await apiFetch<Ward[]>("/api/v1/hospital/beds/");
        if (data && data.length > 0) setWards(data);
      } catch {
        // silently use mock data
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  const allBeds = wards.flatMap(w => w.beds);
  const globalSummary = {
    total: allBeds.length,
    available: allBeds.filter(b => b.status === "available").length,
    occupied: allBeds.filter(b => b.status === "occupied").length,
    cleaning: allBeds.filter(b => b.status === "cleaning").length,
    maintenance: allBeds.filter(b => b.status === "maintenance").length,
  };
  const occupancyPct = Math.round((globalSummary.occupied / globalSummary.total) * 100);

  const dir = lang === "ar" ? "rtl" : "ltr";

  const displayWards = selectedWard ? wards.filter(w => w.id === selectedWard) : wards;

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Bed Management Board" : "لوحة إدارة الأسرة"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Real-time ward and bed occupancy overview" : "نظرة فورية على إشغال الأجنحة والأسرة"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Syncing...</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <a href="/hospital" style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid #22D3EE", color: "#22D3EE", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
          ← {lang === "en" ? "Hospital Portal" : "بوابة المستشفى"}
        </a>
        {[
          { href: "/hospital/adt", label: lang === "en" ? "ADT" : "القبول والخروج" },
          { href: "/hospital/emergency", label: lang === "en" ? "Emergency" : "الطوارئ" },
          { href: "/hospital/icu", label: lang === "en" ? "ICU" : "العناية المركزة" },
          { href: "/hospital/operating-room", label: lang === "en" ? "Operating Room" : "غرفة العمليات" },
          { href: "/hospital/command-center", label: lang === "en" ? "Command Center" : "مركز القيادة" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Global Summary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total Beds" : "إجمالي الأسرة", value: globalSummary.total, color: "#22D3EE" },
          { label: lang === "en" ? "Occupied" : "مشغولة", value: globalSummary.occupied, color: "#6366f1" },
          { label: lang === "en" ? "Available" : "متاحة", value: globalSummary.available, color: "#22c55e" },
          { label: lang === "en" ? "Cleaning" : "تنظيف", value: globalSummary.cleaning, color: "#f59e0b" },
          { label: lang === "en" ? "Maintenance" : "صيانة", value: globalSummary.maintenance, color: "#6b7280" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: `1px solid ${card.color}44`, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy Bar */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{lang === "en" ? "Overall Occupancy" : "الإشغال الكلي"}</span>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: occupancyPct >= 90 ? "#ef4444" : occupancyPct >= 75 ? "#f59e0b" : "#22c55e" }}>{occupancyPct}%</span>
        </div>
        <div style={{ height: "12px", background: "var(--color-border)", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ width: `${occupancyPct}%`, height: "100%", background: occupancyPct >= 90 ? "#ef4444" : occupancyPct >= 75 ? "#f59e0b" : "#22c55e", borderRadius: "6px", transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{lang === "en" ? "Legend:" : "المفتاح:"}</span>
        {(["available", "occupied", "cleaning", "maintenance"] as BedStatus[]).map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: BED_COLORS[s].bg, border: `2px solid ${BED_COLORS[s].border}` }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {s === "available" ? (lang === "en" ? "Available" : "متاح") :
               s === "occupied" ? (lang === "en" ? "Occupied" : "مشغول") :
               s === "cleaning" ? (lang === "en" ? "Cleaning" : "تنظيف") :
               (lang === "en" ? "Maintenance" : "صيانة")}
            </span>
          </div>
        ))}
      </div>

      {/* Ward Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedWard(null)}
          style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: selectedWard === null ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: selectedWard === null ? "#22D3EE22" : "var(--color-surface)", color: selectedWard === null ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}
        >
          {lang === "en" ? "All Wards" : "جميع الأجنحة"}
        </button>
        {wards.map(w => (
          <button
            key={w.id}
            onClick={() => setSelectedWard(w.id === selectedWard ? null : w.id)}
            style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: selectedWard === w.id ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: selectedWard === w.id ? "#22D3EE22" : "var(--color-surface)", color: selectedWard === w.id ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}
          >
            {lang === "ar" ? w.name_ar : w.name}
          </button>
        ))}
      </div>

      {/* Ward Grids */}
      {displayWards.map(ward => {
        const summary = wardSummary(ward.beds);
        const wardOcc = Math.round((summary.occupied / summary.total) * 100);
        const wardColor = wardOcc >= 90 ? "#ef4444" : wardOcc >= 75 ? "#f59e0b" : "#22c55e";
        return (
          <div key={ward.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  {lang === "ar" ? ward.name_ar : ward.name}
                </h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "#22c55e" }}>{summary.available} {lang === "en" ? "available" : "متاح"}</span>
                  <span style={{ fontSize: "0.78rem", color: "#6366f1" }}>{summary.occupied} {lang === "en" ? "occupied" : "مشغول"}</span>
                  {summary.cleaning > 0 && <span style={{ fontSize: "0.78rem", color: "#f59e0b" }}>{summary.cleaning} {lang === "en" ? "cleaning" : "تنظيف"}</span>}
                  {summary.maintenance > 0 && <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{summary.maintenance} {lang === "en" ? "maint." : "صيانة"}</span>}
                </div>
              </div>
              <div style={{ textAlign: lang === "ar" ? "left" : "right" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: wardColor }}>{wardOcc}%</span>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Occupancy" : "إشغال"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {ward.beds.map(bed => {
                const colors = BED_COLORS[bed.status];
                return (
                  <div
                    key={bed.id}
                    onClick={() => setSelectedBed(selectedBed?.id === bed.id ? null : bed)}
                    title={bed.patient_name ? `${bed.patient_name} (${bed.patient_mrn}) — ${bed.hours_occupied}h` : bed.status}
                    style={{
                      width: "72px",
                      height: "56px",
                      background: colors.bg,
                      border: `2px solid ${selectedBed?.id === bed.id ? "#22D3EE" : colors.border}`,
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.1s ease",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.text }}>{bed.number}</span>
                    <span style={{ fontSize: "0.6rem", color: colors.text, opacity: 0.8, marginTop: "2px" }}>
                      {bed.status === "occupied" ? (lang === "en" ? "Occupied" : "مشغول") :
                       bed.status === "available" ? (lang === "en" ? "Free" : "متاح") :
                       bed.status === "cleaning" ? (lang === "en" ? "Clean" : "تنظيف") :
                       (lang === "en" ? "Maint." : "صيانة")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bed Detail Panel */}
      {selectedBed && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "var(--color-surface)", border: "2px solid #22D3EE", borderRadius: "12px", padding: "1.25rem", minWidth: "280px", zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
              {lang === "en" ? "Bed" : "السرير"} {selectedBed.number}
            </h3>
            <button onClick={() => setSelectedBed(null)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
          </div>
          {selectedBed.status === "occupied" && selectedBed.patient_name ? (
            <>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Patient" : "المريض"}: </span>
                <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>
                  {lang === "ar" ? selectedBed.patient_name_ar : selectedBed.patient_name}
                </span>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "MRN" : "رقم السجل"}: </span>
                <span style={{ fontWeight: 600, color: "#22D3EE", fontSize: "0.875rem" }}>{selectedBed.patient_mrn}</span>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Time in bed" : "مدة الإقامة"}: </span>
                <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>{selectedBed.hours_occupied}h</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
              {selectedBed.status === "available" ? (lang === "en" ? "Bed is available for admission." : "السرير متاح للقبول.") :
               selectedBed.status === "cleaning" ? (lang === "en" ? "Bed is being cleaned." : "السرير قيد التنظيف.") :
               (lang === "en" ? "Bed is under maintenance." : "السرير قيد الصيانة.")}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {selectedBed.status === "available" && (
              <a href="/hospital/adt" style={{ padding: "0.4rem 0.875rem", background: "#22D3EE", color: "#0f172a", borderRadius: "6px", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none" }}>
                {lang === "en" ? "Admit Patient" : "قبول مريض"}
              </a>
            )}
            {selectedBed.status === "occupied" && (
              <a href="/hospital/adt" style={{ padding: "0.4rem 0.875rem", background: "#22c55e", color: "#0f172a", borderRadius: "6px", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none" }}>
                {lang === "en" ? "Discharge / Transfer" : "خروج / نقل"}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
