"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First resolve tenant ID via subdomain check or header
      // If subdomain is empty, we default to resolving by hostname
      let resolvedTenantId = null;
      if (subdomain) {
        // Resolve tenant info
        const tenantRes = await fetch(`http://localhost:8000/api/v1/tenants/register/`, {
          method: "GET", // Placeholder check or we allow domain mappings
        });
        // We will pass the subdomain as a header
      }

      // Log in user
      const response = await fetch("http://localhost:8000/api/v1/identity/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.non_field_errors?.[0] || "Invalid credentials");
      }

      const data = await response.json();

      // Save tokens and context to localStorage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("tenant_id", data.tenant_id);
      localStorage.setItem("tenant_name", data.tenant_name);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      localStorage.setItem("scopes", JSON.stringify(data.scopes));

      // Redirect to dashboard
      router.push("/app");
    } catch (err) {
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white flex items-center justify-center font-sans p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-black">
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600 via-sky-400 to-orange-500"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-4 h-4 bg-[#ED6C00] rounded-full animate-pulse"></span>
            <span className="font-bold tracking-wider text-xl uppercase font-mono text-zinc-100">CYShop Engine</span>
          </div>
          <p className="text-zinc-400 text-sm">Enter your organizational credentials to sign in</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-zinc-300 text-xs font-semibold mb-2 uppercase tracking-wide">
              Subdomain / Tenant Context
            </label>
            <input
              type="text"
              placeholder="e.g. acme"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ED6C00] focus:ring-1 focus:ring-[#ED6C00] transition duration-200"
            />
          </div>

          <div>
            <label className="block text-zinc-300 text-xs font-semibold mb-2 uppercase tracking-wide">
              Username or Email
            </label>
            <input
              type="text"
              required
              placeholder="admin@company.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ED6C00] focus:ring-1 focus:ring-[#ED6C00] transition duration-200"
            />
          </div>

          <div>
            <label className="block text-zinc-300 text-xs font-semibold mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ED6C00] focus:ring-1 focus:ring-[#ED6C00] transition duration-200"
            />
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-zinc-950 border-zinc-800 text-orange-600 focus:ring-0" />
              Remember me
            </label>
            <a href="#" className="hover:text-white transition duration-200">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ED6C00] hover:bg-orange-600 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-lg text-sm transition duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          New client?{" "}
          <button
            onClick={() => router.push("/wizard")}
            className="text-sky-400 hover:text-sky-300 transition duration-200 font-semibold"
          >
            Setup your Tenant Space
          </button>
        </div>
      </div>
    </div>
  );
}
