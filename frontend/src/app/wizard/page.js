"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tenantName, setTenantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatusMsg("Connecting to cloud gateway...");

    try {
      // Step-by-step progress simulation
      setTimeout(() => setStatusMsg("Creating isolated tenant database schema..."), 1000);
      setTimeout(() => setStatusMsg("Provisioning core organization structure..."), 2000);
      setTimeout(() => setStatusMsg("Initializing administrator credentials & RBAC mapping..."), 3000);

      const response = await fetch("http://localhost:8000/api/v1/tenants/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tenantName,
          subdomain: subdomain,
          email: email,
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to provision tenant space");
      }

      const data = await response.json();
      
      setStatusMsg("Onboarding complete! Redirecting to credentials console...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (err) {
      setError(err.message || "An unexpected provisioning error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white flex items-center justify-center font-sans p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-black">
      <div className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600 via-sky-400 to-orange-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-4 h-4 bg-sky-400 rounded-full animate-ping"></span>
            <span className="font-bold tracking-wider text-xl uppercase font-mono text-zinc-100">Tenant Setup Wizard</span>
          </div>
          <p className="text-zinc-400 text-sm">Deploy a new isolated commerce node in seconds</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-sky-400 animate-spin"></div>
            </div>
            <p className="text-zinc-300 font-mono text-sm tracking-wide animate-pulse">{statusMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-zinc-300 font-semibold text-sm border-b border-zinc-800 pb-2">Step 1: Tenant Information</h3>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Tenant Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Sweets Ltd"
                    value={tenantName}
                    onChange={(e) => {
                      setTenantName(e.target.value);
                      // Auto-suggest subdomain
                      setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                    }}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Subdomain Prefix
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      placeholder="acmesweets"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-l-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                    />
                    <span className="bg-zinc-800 border-y border-r border-zinc-800 px-4 py-3 text-sm text-zinc-400 rounded-r-lg font-mono">
                      .cy-com.com
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!tenantName || !subdomain}
                  className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-semibold py-3 rounded-lg text-sm transition flex justify-center items-center disabled:opacity-50"
                >
                  Continue to Credentials
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-zinc-300 font-semibold text-sm border-b border-zinc-800 pb-2">Step 2: Administrator Account</h3>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="acmeadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg text-sm transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#ED6C00] hover:bg-orange-600 active:scale-[0.99] text-white font-semibold py-3 rounded-lg text-sm transition"
                  >
                    Deploy Node
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="mt-8 text-center text-xs text-zinc-500">
          Already have a tenant space?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-orange-500 hover:text-orange-400 transition duration-200 font-semibold"
          >
            Access Credentials Console
          </button>
        </div>
      </div>
    </div>
  );
}
