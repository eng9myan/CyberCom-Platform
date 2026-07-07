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

  const navBtnCls = (active: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${isRtl ? "text-right" : "text-left"} ${
      active ? "border-brand-400/60 bg-brand-500 text-white" : "border-ink/10 text-ink/70 hover:bg-ink/5"
    }`;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {t.toggleLang}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button onClick={() => setActiveTab("models")} className={navBtnCls(activeTab === "models")}>{t.modelTab}</button>
          <button onClick={() => setActiveTab("prompts")} className={navBtnCls(activeTab === "prompts")}>{t.promptTab}</button>
          <button onClick={() => setActiveTab("logs")} className={navBtnCls(activeTab === "logs")}>{t.logTab}</button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "models" && (
            <div>
              <h2 className="text-lg font-bold">{t.modelTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.name}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.provider}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.model}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.active}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(m => (
                    <tr key={m.id} className="border-b border-ink/5">
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3"><span className="rounded bg-ink/10 px-1.5 py-0.5 text-[13px] uppercase">{m.provider}</span></td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{m.model}</code></td>
                      <td className={`px-4 py-3 ${m.active ? "text-emerald-400" : "text-ink/40"}`}>{m.active ? t.active : t.inactive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "prompts" && (
            <div>
              <h2 className="text-lg font-bold">{t.promptTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.name}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>Template Text</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.version}</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map(p => (
                    <tr key={p.id} className="border-b border-ink/5">
                      <td className="px-4 py-3 font-bold">{p.name}</td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{p.text}</code></td>
                      <td className="px-4 py-3"><span className="rounded bg-ink/10 px-2 py-0.5">v{p.version}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <h2 className="text-lg font-bold">{t.logTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.prompt}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.response}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.tokens}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.safety}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="border-b border-ink/5">
                      <td className="px-4 py-3">{l.prompt}</td>
                      <td className="px-4 py-3 text-ink/50">{l.response}</td>
                      <td className="px-4 py-3">{l.tokens}</td>
                      <td className={`px-4 py-3 font-bold ${l.safety === "passed" ? "text-emerald-400" : "text-red-400"}`}>{l.safety.toUpperCase()}</td>
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
