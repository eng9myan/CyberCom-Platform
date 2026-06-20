"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, ShieldAlert, Settings, User, LogOut, Bell, Menu, ChevronLeft, ChevronRight,
  Target, FileText, ShoppingBag, BarChart3, MessageSquare, Layers
} from "lucide-react";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setTenantName(localStorage.getItem("tenant_name") || "Tenant");
    setUsername(localStorage.getItem("username") || "User");
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const tenantId = localStorage.getItem("tenant_id");
      const response = await fetch("http://localhost:8000/api/v1/notifications/", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch("http://localhost:8000/api/v1/identity/logout/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error(err);
    }
    localStorage.clear();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/app", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "CRM Kanban", path: "/app/crm", icon: <Layers className="w-5 h-5" /> },
    { name: "Leads", path: "/app/leads", icon: <Target className="w-5 h-5" /> },
    { name: "Quotations", path: "/app/quotations", icon: <FileText className="w-5 h-5" /> },
    { name: "Sales Orders", path: "/app/orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { name: "Sales Analytics", path: "/app/sales-dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { name: "Customer Portal", path: "/app/customer-portal", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "Users", path: "/app/users", icon: <Users className="w-5 h-5" /> },
    { name: "Roles & RBAC", path: "/app/roles", icon: <ShieldAlert className="w-5 h-5" /> },
    { name: "System Settings", path: "/app/settings", icon: <Settings className="w-5 h-5" /> },
    { name: "My Profile", path: "/app/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#111] text-zinc-100 flex font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-black">
      
      {/* Sidebar Navigation */}
      <aside className={`bg-zinc-950/80 border-r border-zinc-800 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}>
        <div className="h-20 border-b border-zinc-850 px-6 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
              <span className="font-bold tracking-wider text-sm font-mono text-zinc-100 truncate w-40">{tenantName}</span>
            </div>
          ) : (
            <span className="w-4 h-4 bg-orange-500 rounded-full mx-auto"></span>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-[#ED6C00] text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-850 p-4 flex flex-col gap-2">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase truncate w-32">{username}</div>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition duration-200">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-lg flex items-center justify-center transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-zinc-950/40 backdrop-blur-md border-b border-zinc-800 px-8 flex items-center justify-between z-30">
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-300">
            {navItems.find((n) => n.path === pathname)?.name || "CYShop Console"}
          </h2>

          <div className="flex items-center gap-6">
            {/* Notification drop */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 text-xs flex flex-col gap-3">
                  <span className="font-bold text-zinc-400 uppercase tracking-widest block border-b border-zinc-800 pb-2">
                    In-App Notifications
                  </span>
                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <span className="text-zinc-500 text-center py-4">No recent messages</span>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                          notif.is_read ? "bg-zinc-950/40 border-zinc-850 text-zinc-400" : "bg-orange-950/20 border-orange-900/40 text-orange-200"
                        }`}>
                          <span className="font-bold">{notif.title}</span>
                          <span className="text-[10px] text-zinc-400">{notif.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
              <div className="w-9 h-9 rounded-xl bg-[#ED6C00] flex items-center justify-center text-white font-bold text-sm">
                {username.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Child Router Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
