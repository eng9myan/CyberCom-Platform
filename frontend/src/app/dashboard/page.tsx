"use client";

import { useAuth } from "@/contexts/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { session, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, router]);

  if (!session) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>لوحة التحكم — Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-400">{session.email}</span>
          <button onClick={logout} className="theme-toggle-btn">
            تسجيل الخروج / Logout
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="glass-card">
          <h3>المستأجر / Tenant</h3>
          <p className="metric-value">{session.tenantId.slice(0, 8)}…</p>
        </div>
        <div className="glass-card">
          <h3>الأدوار / Roles</h3>
          <p className="metric-value">{session.roles.length}</p>
          <span className="metric-detail">{session.roles.join(", ")}</span>
        </div>
        <div className="glass-card">
          <h3>الصلاحيات / Permissions</h3>
          <p className="metric-value">{session.permissions.length}</p>
        </div>
      </div>
    </div>
  );
}
