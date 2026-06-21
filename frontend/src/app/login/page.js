"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import Logo from "@/components/brand/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${base}/api/v1/identity/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(subdomain ? { "X-Tenant-Subdomain": subdomain } : {}) },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.non_field_errors?.[0] || err.detail || "Invalid credentials");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("tenant_id", data.tenant_id);
      localStorage.setItem("tenant_name", data.tenant_name);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      localStorage.setItem("scopes", JSON.stringify(data.scopes || []));
      router.push("/app");
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Form column */}
      <div className="relative flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition">
            ← Back home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md py-12">
          <span className="cy-pill cy-pill-orange"><Sparkles className="w-3.5 h-3.5" /> Sign in to Cyshop</span>
          <h1 className="mt-5 text-3xl md:text-4xl font-heading font-black leading-tight">Welcome back.</h1>
          <p className="mt-2 text-[var(--color-ink-soft)]">Pick up where the AI left off.</p>

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-3 p-3 rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.06)] text-[#DC2626] text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <Field
              id="subdomain"
              label="Workspace"
              hint="Leave blank to use your default tenant."
              value={subdomain}
              onChange={setSubdomain}
              placeholder="acme"
              autoComplete="organization"
              suffix=".cyshop.app"
            />
            <Field
              id="username"
              label="Email or username"
              type="text"
              required
              value={username}
              onChange={setUsername}
              placeholder="you@company.com"
              autoComplete="username"
            />
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink-soft)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 rounded-xl bg-white border border-[var(--color-line)] px-4 pr-11 text-sm focus:outline-none focus:border-[#ED6C00] focus:ring-2 focus:ring-[rgba(237,108,0,0.18)] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] flex items-center justify-center transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-[var(--color-ink-soft)]">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-line)] text-[#ED6C00] focus:ring-[#ED6C00]" />
                Remember me
              </label>
              <a href="#" className="font-semibold text-[#ED6C00] hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cy-btn cy-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[var(--color-ink-muted)]">
            New to Cyshop?{" "}
            <Link href="/wizard" className="font-semibold text-[var(--color-ink)] hover:text-[#ED6C00]">
              Create your workspace →
            </Link>
          </div>
        </div>

        <p className="text-xs text-[var(--color-ink-muted)]">
          © {new Date().getFullYear()} Cyshop · A CyberCom company
        </p>
      </div>

      {/* Visual column */}
      <div className="relative hidden lg:block overflow-hidden bg-[var(--color-brand-ink)] text-white">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(40rem 30rem at 80% 10%, rgba(237,108,0,.45), transparent 60%), radial-gradient(40rem 30rem at 10% 100%, rgba(89,195,225,.4), transparent 60%)",
          }}
        />
        <div className="relative h-full flex flex-col justify-between p-12">
          <div />
          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
              <span className="cy-blink" /> Live AI workspace
            </span>
            <h2 className="mt-4 text-3xl xl:text-4xl font-heading font-black leading-tight">
              Your commerce stack, <br />
              <span className="cy-text-gradient">already thinking ahead.</span>
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              Pipeline forecasts, churn alerts, and quote drafts ready the moment you sign in.
              Tenant-isolated. Encrypted. Production-grade.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Multi-tenant by design", "GraphQL + REST surface", "Audit log on every change"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59C3E1]" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-white/40">SOC2 controls · GDPR ready · Built for global commerce</div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, hint, value, onChange, placeholder, autoComplete, type = "text", required, suffix }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink-soft)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full h-11 rounded-xl bg-white border border-[var(--color-line)] px-4 ${suffix ? "pr-28" : ""} text-sm focus:outline-none focus:border-[#ED6C00] focus:ring-2 focus:ring-[rgba(237,108,0,0.18)] transition`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-ink-muted)] font-mono">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p>}
    </div>
  );
}
