"use client";

import { useState, useEffect } from "react";
import { Users, Building, MapPin, ClipboardList, Shield, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, companies: 0, branches: 0, logs: 0 });
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access_token");
    const tenantId = localStorage.getItem("tenant_id");

    if (!token || !tenantId) return;

    try {
      const headers = {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId
      };

      // 1. Fetch companies
      const compRes = await fetch("http://localhost:8000/api/v1/tenants/companies/", { headers });
      const compData = compRes.ok ? await compRes.json() : [];

      // 2. Fetch branches
      const branchRes = await fetch("http://localhost:8000/api/v1/tenants/branches/", { headers });
      const branchData = branchRes.ok ? await branchRes.json() : [];

      // 3. Fetch users
      const userRes = await fetch("http://localhost:8000/api/v1/identity/users/", { headers });
      const userData = userRes.ok ? await userRes.json() : [];

      // 4. Fetch audit logs
      const logRes = await fetch("http://localhost:8000/api/v1/audit/", { headers });
      const logData = logRes.ok ? await logRes.json() : [];

      setCompanies(compData);
      setBranches(branchData);
      setLogs(logData.slice(0, 5)); // show latest 5
      
      setStats({
        users: userData.length,
        companies: compData.length,
        branches: branchData.length,
        logs: logData.length
      });
    } catch (err) {
      setError("Failed to fetch dashboard metrics. Verify backend connection.");
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
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade text-zinc-100">
      
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Users", value: stats.users, icon: <Users className="w-5 h-5 text-orange-500" /> },
          { title: "Companies", value: stats.companies, icon: <Building className="w-5 h-5 text-sky-400" /> },
          { title: "Active Branches", value: stats.branches, icon: <MapPin className="w-5 h-5 text-emerald-400" /> },
          { title: "Audit Log Entries", value: stats.logs, icon: <ClipboardList className="w-5 h-5 text-purple-400" /> },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{kpi.title}</span>
              <div className="text-3xl font-extrabold font-mono">{kpi.value}</div>
            </div>
            <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-850">
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Organizations Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Companies Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-400" /> Organization Companies
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3">Name</th>
                  <th className="py-3">Legal Name</th>
                  <th className="py-3">Tax Number</th>
                  <th className="py-3">Country</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-zinc-500">No companies initialized</td>
                  </tr>
                ) : (
                  companies.map((comp) => (
                    <tr key={comp.id}>
                      <td className="py-3 font-bold text-zinc-100">{comp.name}</td>
                      <td className="py-3">{comp.legal_name || "N/A"}</td>
                      <td className="py-3 font-mono">{comp.tax_number || "N/A"}</td>
                      <td className="py-3">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{comp.country_code}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branches Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Active Branches
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3">Branch Name</th>
                  <th className="py-3">Physical Address</th>
                  <th className="py-3">Timezone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-zinc-500">No active branches</td>
                  </tr>
                ) : (
                  branches.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 font-bold text-zinc-100">{b.name}</td>
                      <td className="py-3">{b.address}</td>
                      <td className="py-3 font-mono text-zinc-400">{b.timezone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent System Audit Logs */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-400" /> Recent Security & Data Actions
          </span>
          <button onClick={fetchData} className="text-zinc-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-3">Timestamp</th>
                <th className="py-3">Operator</th>
                <th className="py-3">System Action</th>
                <th className="py-3">IP Address</th>
                <th className="py-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-zinc-500">No activity recorded</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-950/20 transition duration-150">
                    <td className="py-3 font-mono text-zinc-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 font-bold text-zinc-100">{log.username}</td>
                    <td className="py-3 font-medium">{log.action}</td>
                    <td className="py-3 font-mono text-zinc-400">{log.ip_address}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                        log.method === "POST" ? "bg-green-950/40 border border-green-900/60 text-green-400" :
                        log.method === "DELETE" ? "bg-red-950/40 border border-red-900/60 text-red-400" :
                        "bg-zinc-950 border border-zinc-800 text-zinc-400"
                      }`}>
                        {log.method}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
