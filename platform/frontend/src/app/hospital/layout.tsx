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
  Receipt,
  Package,
  Users,
  BarChart3,
  Search,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";

const CLINICAL_NAV_ITEMS = [
  { href: "/hospital", label: "Command Overview", icon: LayoutDashboard },
  { href: "/hospital/command-center", label: "Command Center", icon: LayoutDashboard },
  { href: "/hospital/patients", label: "Patient Registration", icon: UserPlus },
  { href: "/hospital/appointments", label: "Appointment Calendar", icon: CalendarDays },
  { href: "/hospital/doctor-workspace", label: "Doctor Workspace", icon: Stethoscope },
  { href: "/hospital/adt", label: "Admissions (ADT)", icon: ClipboardList },
  { href: "/hospital/emergency", label: "Emergency", icon: Siren },
  { href: "/hospital/icu", label: "ICU", icon: HeartPulse },
  { href: "/hospital/operating-room", label: "Operating Room", icon: Scissors },
  { href: "/hospital/beds", label: "Bed Management", icon: BedDouble },
];

const ERP_NAV_ITEMS = [
  { href: "/hospital/billing", label: "Billing & Invoicing", icon: Receipt },
  { href: "/hospital/inventory", label: "Inventory Management", icon: Package },
  { href: "/hospital/hr", label: "HR & Payroll", icon: Users },
  { href: "/hospital/reports", label: "Reports & Dashboards", icon: BarChart3 },
];

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

  const displayName = session?.displayName || session?.email || "Unknown user";
  const primaryRole = session?.roles?.[0];

  return (
    <div className="flex min-h-screen bg-surface text-white">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-white/10 bg-surface-raised transition-transform md:relative md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/hospital" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">
              CH
            </div>
            <span className="text-sm font-semibold tracking-wide">CyMed Hospital</span>
          </Link>
          <button
            className="text-white/60 hover:text-white md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 4rem)" }}>
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Clinical Operations
          </p>
          {CLINICAL_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}

          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-white/40">
            ERP & Operations
          </p>
          {ERP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/10 bg-surface/90 px-4 backdrop-blur md:px-6">
          <button
            className="text-white/70 hover:text-white md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder="Search patients, beds, orders..."
              className="w-full rounded-lg border border-white/10 bg-surface-overlay py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-brand-400 focus:outline-none"
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-bold">
                  {initials(displayName)}
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600"
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
