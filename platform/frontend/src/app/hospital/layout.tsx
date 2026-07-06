"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Siren,
  HeartPulse,
  Scissors,
  BedDouble,
  UserPlus,
  CalendarDays,
  Stethoscope,
  Pill,
  Receipt,
  Package,
  Users,
  BarChart3,
  Search,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";

const ADMIN_ROLES = ["platform_admin", "cyidentity_admin", "hospital_admin"];

const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { href: "/hospital", label: "Command Overview", icon: LayoutDashboard },
      { href: "/hospital/command-center", label: "Command Center", icon: LayoutDashboard },
    ],
  },
  {
    label: "Clinical Operations",
    items: [
      { href: "/hospital/patients", label: "Patient Registration", icon: UserPlus },
      { href: "/hospital/appointments", label: "Appointment Calendar", icon: CalendarDays },
      { href: "/hospital/doctor-workspace", label: "Doctor Workspace", icon: Stethoscope },
      { href: "/hospital/adt", label: "Admissions (ADT)", icon: ClipboardList },
      { href: "/hospital/emar", label: "Medication Admin (eMAR)", icon: Pill },
      { href: "/hospital/emergency", label: "Emergency", icon: Siren },
      { href: "/hospital/icu", label: "ICU", icon: HeartPulse },
      { href: "/hospital/operating-room", label: "Operating Room", icon: Scissors },
      { href: "/hospital/beds", label: "Bed Management", icon: BedDouble },
    ],
  },
  {
    label: "ERP & Operations",
    items: [
      { href: "/hospital/billing", label: "Billing & Invoicing", icon: Receipt },
      { href: "/hospital/inventory", label: "Inventory Management", icon: Package },
      { href: "/hospital/hr", label: "HR & Payroll", icon: Users },
      { href: "/hospital/reports", label: "Reports & Dashboards", icon: BarChart3 },
    ],
  },
];

const SETTINGS_GROUP = {
  label: "Settings",
  items: [
    { href: "/hospital/settings/users", label: "Users", icon: Users },
    { href: "/hospital/settings/roles", label: "Roles & Permissions", icon: ShieldCheck },
  ],
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const displayName = session?.displayName || session?.email || "Unknown user";
  const primaryRole = session?.roles?.[0];
  const isAdmin = (session?.roles || []).some(r => ADMIN_ROLES.includes(r));
  const groups = isAdmin ? [...NAV_GROUPS, SETTINGS_GROUP] : NAV_GROUPS;
  const flatNav = groups.flatMap(g => g.items);
  const currentPage = flatNav.find(n => n.href === pathname);

  return (
    <div className="flex min-h-dvh bg-surface text-white">
      <aside
        className={`fixed inset-y-0 left-0 z-40 shrink-0 border-r border-white/[0.07] bg-surface-raised transition-[width,transform] duration-300 md:relative md:translate-x-0 ${
          collapsed ? "md:w-[76px]" : "md:w-[260px]"
        } w-64 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-4">
          <Link href="/hospital" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-400 text-sm font-bold text-white">
              CH
            </div>
            {!collapsed && <span className="truncate text-sm font-semibold tracking-wide">CyMed Hospital</span>}
          </Link>
          <button
            className="text-white/60 hover:text-white md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" style={{ maxHeight: "calc(100dvh - 8rem)" }}>
          {groups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMobileNavOpen(false)}
                        title={collapsed ? label : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-brand-500/10 text-white"
                            : "text-white/60 hover:bg-surface-overlay hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-brand-500" aria-hidden />
                        )}
                        <Icon size={18} strokeWidth={2} className={`shrink-0 ${active ? "text-brand-400" : ""}`} />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/[0.07] p-3">
          {!collapsed && isAuthenticated && (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-xs font-bold text-white">
                {initials(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                {primaryRole && <p className="truncate text-xs leading-tight text-white/40">{primaryRole}</p>}
              </div>
              <button
                onClick={logout}
                aria-label="Log out"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-surface-overlay hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-9 w-full items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-surface-overlay md:flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/[0.07] bg-surface/85 px-4 backdrop-blur-xl md:px-6">
          <button
            className="text-white/70 hover:text-white md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="hidden min-w-0 md:block">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">CyMed Hospital</p>
            <h1 className="truncate font-heading text-base font-bold leading-tight">{currentPage?.label ?? "Console"}</h1>
          </div>

          <div className="relative mx-auto hidden max-w-sm flex-1 md:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder="Search patients, beds, orders..."
              className="w-full rounded-xl border border-white/10 bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight">{displayName}</p>
                  {primaryRole && (
                    <p className="text-xs leading-tight text-white/40">{primaryRole}</p>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-xs font-bold text-white">
                  {initials(displayName)}
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="rounded-lg p-2 text-white/60 hover:bg-surface-overlay hover:text-white"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
