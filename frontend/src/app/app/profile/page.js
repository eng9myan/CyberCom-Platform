"use client";

import { useState, useEffect } from "react";
import { User, Shield, Key, Laptop, Smartphone } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access_token");
    const tenantId = localStorage.getItem("tenant_id");

    try {
      const headers = {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId
      };

      // 1. Fetch current profile
      const profRes = await fetch("http://localhost:8000/api/v1/identity/profiles/", { headers });
      const profData = profRes.ok ? await profRes.json() : [];

      // 2. Fetch sessions
      const sessRes = await fetch("http://localhost:8000/api/v1/identity/sessions/", { headers });
      const sessData = sessRes.ok ? await sessRes.json() : [];

      // 3. Fetch devices
      const devRes = await fetch("http://localhost:8000/api/v1/identity/devices/", { headers });
      const devData = devRes.ok ? await devRes.json() : [];

      if (profData.length > 0) {
        setProfile(profData[0]);
      }
      setSessions(sessData);
      setDevices(devData);
    } catch (err) {
      setError("Failed to load user profile metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-zinc-850 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade text-zinc-100">
      
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* User Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold font-mono">
            {localStorage.getItem("username")?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-base text-zinc-100">{localStorage.getItem("username")}</h4>
            <p className="text-zinc-500 text-xs font-mono">{localStorage.getItem("email")}</p>
          </div>
          <div className="w-full border-t border-zinc-850 pt-4 flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            <div className="flex justify-between">
              <span>Security Group:</span>
              <span className="text-orange-400 font-mono">ADMIN</span>
            </div>
            <div className="flex justify-between">
              <span>MFA Status:</span>
              <span className="text-zinc-500">DISABLED</span>
            </div>
          </div>
        </div>

        {/* Sessions & Devices */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Active Devices */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-400" /> Active Security Devices
            </h3>

            <div className="space-y-3">
              {devices.length === 0 ? (
                <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850 text-xs">
                  <Laptop className="w-5 h-5 text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-200">Current Web Client (Default)</span>
                    <span className="text-zinc-500 text-[10px]">Windows OS · Active Web Console Session</span>
                  </div>
                </div>
              ) : (
                devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-lg border border-zinc-850 text-xs">
                    <div className="flex items-center gap-3">
                      {d.device_type === "MOBILE" ? <Smartphone className="w-5 h-5 text-emerald-400" /> : <Laptop className="w-5 h-5 text-sky-400" />}
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-200">{d.device_name}</span>
                        <span className="text-zinc-500 text-[10px]">{d.os_name} · {d.device_type}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" /> Session Expiry Log
            </h3>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center py-2">No active sessions found</div>
              ) : (
                sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-xs font-semibold bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                    <span className="text-zinc-400 font-mono truncate w-40">{s.token.slice(0, 30)}...</span>
                    <span className="text-[10px] text-zinc-500">Expires: {new Date(s.expires_at).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
