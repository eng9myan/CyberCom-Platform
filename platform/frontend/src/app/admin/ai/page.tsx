"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface Model {
  id: string;
  name: string;
  provider: string;
  model: string;
  active: boolean;
}

interface Prompt {
  id: string;
  name: string;
  text: string;
  version: number;
}

interface InferenceLog {
  id: string;
  prompt: string;
  response: string;
  tokens: number;
  safety: "passed" | "blocked" | "flagged";
}

export default function AIAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "CyAI Model Gateway & Prompt Workbench",
      subtitle: "Manage LLM Provider Endpoints, Prompts Versioning, and Inference Auditing",
      toggleLang: "العربية",
      modelTab: "AI Providers",
      promptTab: "Prompt Templates",
      logTab: "Inference & Guardrail Logs",
      name: "Config Name",
      provider: "LLM Provider",
      model: "Model Name",
      active: "Active",
      inactive: "Inactive",
      prompt: "Prompt",
      response: "Completion",
      tokens: "Tokens",
      safety: "Safety",
      version: "Version",
    },
    ar: {
      title: "بوابة النماذج وبيئة عمل الموجهات (CyAI)",
      subtitle: "إدارة اتصالات نماذج الذكاء الاصطناعي، وإصدارات الموجهات، وتدقيق عمليات الاستدلال",
      toggleLang: "English",
      modelTab: "مزودي خدمات الذكاء الاصطناعي",
      promptTab: "قوالب الموجهات",
      logTab: "سجلات الاستدلال والحماية",
      name: "اسم الإعداد",
      provider: "مزود الخدمة",
      model: "اسم النموذج",
      active: "نشط",
      inactive: "غير نشط",
      prompt: "الموجه (Prompt)",
      response: "الإكمال (Completion)",
      tokens: "الرموز (Tokens)",
      safety: "الحماية",
      version: "الإصدار",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"models" | "prompts" | "logs">("models");

  const [models] = useState<Model[]>([
    { id: "1", name: "Gemini Pro Clinical", provider: "gemini", model: "gemini-1.5-pro", active: true },
    { id: "2", name: "OpenAI GPT-4o Gateway", provider: "openai", model: "gpt-4o", active: true },
    { id: "3", name: "Claude 3.5 Sonnet", provider: "anthropic", model: "claude-3-5-sonnet", active: false }
  ]);

  const [prompts] = useState<Prompt[]>([
    { id: "p1", name: "clinical_patient_summary", text: "Summarize history for patient {name} based on raw admission records: {context}", version: 2 },
    { id: "p2", name: "erp_ledger_classification", text: "Classify transaction amount {amount} into financial accounting category.", version: 1 }
  ]);

  const [logs] = useState<InferenceLog[]>([
    { id: "l1", prompt: "Summarize records for John Doe", response: "[Gemini] Patient John Doe has a history of high blood pressure...", tokens: 184, safety: "passed" },
    { id: "l2", prompt: "Classify ledger entry 5000 USD", response: "[GPT] Financial category set to operational expense.", tokens: 92, safety: "passed" },
    { id: "l3", prompt: "Summarize clinical history containing patient MRN104928 and phone 555-0199", response: "Blocked by safety guardrail policies.", tokens: 32, safety: "blocked" }
  ]);

  return (
    <div className="dashboard-container" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <header className="dashboard-header">
        <div>
          <h1>{t.title}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="theme-toggle-btn">
          {t.toggleLang}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)" }}>
        <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
          <button onClick={() => setActiveTab("models")} style={{ background: activeTab === "models" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.modelTab}</button>
          <button onClick={() => setActiveTab("prompts")} style={{ background: activeTab === "prompts" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.promptTab}</button>
          <button onClick={() => setActiveTab("logs")} style={{ background: activeTab === "logs" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.logTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "models" && (
            <div>
              <h2>{t.modelTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.name}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.provider}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.model}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.active}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px" }}>{m.name}</td>
                      <td style={{ padding: "8px" }}><span style={{ textTransform: "uppercase", fontSize: "0.85rem", background: "rgb(var(--color-ink-rgb) / 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{m.provider}</span></td>
                      <td style={{ padding: "8px" }}><code>{m.model}</code></td>
                      <td style={{ padding: "8px", color: m.active ? "var(--color-success)" : "var(--color-text-subtle)" }}>{m.active ? t.active : t.inactive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "prompts" && (
            <div>
              <h2>{t.promptTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.name}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>Template Text</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.version}</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{p.name}</td>
                      <td style={{ padding: "8px" }}><code>{p.text}</code></td>
                      <td style={{ padding: "8px" }}><span style={{ background: "rgb(var(--color-ink-rgb) / 0.1)", padding: "2px 8px", borderRadius: "4px" }}>v{p.version}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <h2>{t.logTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.prompt}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.response}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.tokens}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.safety}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px" }}>{l.prompt}</td>
                      <td style={{ padding: "8px", color: "var(--color-text-muted)" }}>{l.response}</td>
                      <td style={{ padding: "8px" }}>{l.tokens}</td>
                      <td style={{ padding: "8px", color: l.safety === "passed" ? "var(--color-success)" : "var(--color-error)", fontWeight: "bold" }}>{l.safety.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
