"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldAlert, Key, Plus } from "lucide-react";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      const roleRes = await fetch("http://localhost:8000/api/v1/identity/roles/", { headers });
      const roleData = roleRes.ok ? await roleRes.json() : [];

      const permRes = await fetch("http://localhost:8000/api/v1/identity/permissions/", { headers });
      const permData = permRes.ok ? await permRes.json() : [];

      setRoles(roleData);
      setPermissions(permData);
    } catch (err) {
      setError("Failed to load security definitions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const token = localStorage.getItem("access_token");
    const tenantId = localStorage.getItem("tenant_id");

    try {
      const response = await fetch("http://localhost:8000/api/v1/identity/roles/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId
        },
        body: JSON.stringify({
          code: newRoleCode.toUpperCase(),
          name: newRoleName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create role");
      }

      setNewRoleCode("");
      setNewRoleName("");
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
    <div className="space-y-8 animate-fade text-zinc-100">
      
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roles Table */}
        <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" /> Security Roles
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3">Role Code</th>
                  <th className="py-3">Display Name</th>
                  <th className="py-3">Assigned Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-zinc-500">No security roles declared</td>
                  </tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.id}>
                      <td className="py-4 font-mono font-bold text-orange-400">{r.code}</td>
                      <td className="py-4 font-bold text-zinc-100">{r.name}</td>
                      <td className="py-4 text-zinc-400">
                        {r.permissions?.length || 0} scopes mapped
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Role & System Permissions */}
        <div className="space-y-8">
          
          {/* Create Role Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" /> Create Security Role
            </h3>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-2">Role Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASHIER"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-2">Role Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POS Sales Agent"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50"
              >
                {submitting ? "Deploying..." : "Add Security Role"}
              </button>
            </form>
          </div>

          {/* Permissions Registry list */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" /> Active Permission Registry
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {permissions.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center py-4">No permission scopes registered</div>
              ) : (
                permissions.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs font-semibold bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-lg">
                    <span className="font-mono text-zinc-300">{p.code}</span>
                    <span className="text-[10px] text-zinc-500">{p.name}</span>
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
