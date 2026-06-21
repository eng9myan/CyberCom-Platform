"use client";

import { useState } from "react";

export default function DashboardHome() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="dashboard-container" id="cybercom-dashboard-root">
      <header className="dashboard-header" id="cybercom-dashboard-header">
        <h1 id="cybercom-dashboard-title">
          CyberCom Enterprise Portal (بوابة سايبركوم للمؤسسات)
        </h1>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          id="cybercom-theme-toggle"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <div className="metrics-grid" id="cybercom-metrics-grid">
        <div className="glass-card" id="cybercom-card-tenant">
          <h3>Platform Status (حالة المنصة)</h3>
          <p className="metric-value">Bootstrap</p>
          <span className="metric-detail">Program 2.0 — Foundation Phase</span>
        </div>
        <div className="glass-card" id="cybercom-card-database">
          <h3>Backend (الخلفية)</h3>
          <p className="metric-value">Django 5</p>
          <span className="metric-detail">Python 3.12 · PostgreSQL 16</span>
        </div>
        <div className="glass-card" id="cybercom-card-event">
          <h3>Events (الأحداث)</h3>
          <p className="metric-value">Kafka</p>
          <span className="metric-detail">Outbox pattern · Avro schema</span>
        </div>
      </div>

      <section className="info-section" id="cybercom-info-section">
        <h2>CyberCom Platform 2.0 — Foundation Bootstrap</h2>
        <p>
          Platform foundation is complete. Backend, frontend, mobile, infrastructure,
          CI/CD, security, and observability foundations are initialized.
        </p>
      </section>
    </div>
  );
}
