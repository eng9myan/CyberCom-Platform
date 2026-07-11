"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ClipboardCheck, UserPlus, CalendarDays, ClipboardList, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type AppointmentStatus = "proposed" | "pending" | "booked" | "arrived" | "fulfilled" | "cancelled";
interface Appointment {
  id: string;
  status: AppointmentStatus;
  start_time: string;
}
interface Paginated<T> { count: number; results: T[]; }

const DEEP_LINKS = [
  { href: "/hospital/reception", label: "Reception", icon: ClipboardCheck, description: "Check-in and queue management" },
  { href: "/hospital/patients", label: "Patient Registration", icon: UserPlus, description: "Register new and returning patients" },
  { href: "/hospital/appointments", label: "Appointment Calendar", icon: CalendarDays, description: "Book and manage appointments" },
  { href: "/hospital/adt", label: "Admissions (ADT)", icon: ClipboardList, description: "Admission/transfer status lookups" },
];

export default function ReceptionistWorkspace() {
  const { session, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const page = await apiFetch<Paginated<Appointment>>("/api/v1/scheduling/", {
        token: session.accessToken, tenantId: session.tenantId,
      });
      setAppointments(page.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load appointments."));
    }
  }, [session]);

  useEffect(() => { void loadAppointments(); }, [loadAppointments]);

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const today = new Date().toDateString();
  const todayAppointments = (appointments || []).filter(a => new Date(a.start_time).toDateString() === today);
  const arrivedToday = todayAppointments.filter(a => a.status === "arrived");
  const bookedToday = todayAppointments.filter(a => a.status === "booked" || a.status === "pending");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck size={24} /> Receptionist Workspace</h1>
        <p className="mt-1 text-sm text-white/50">Today&apos;s appointment status, with quick access into check-in and registration</p>
      </header>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Unable to load appointment summary: {fetchError}
        </div>
      )}

      {!fetchError && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Today's Appointments", value: appointments === null ? "..." : todayAppointments.length, color: "#22D3EE" },
            { label: "Arrived", value: appointments === null ? "..." : arrivedToday.length, color: "#22c55e" },
            { label: "Awaiting Arrival", value: appointments === null ? "..." : bookedToday.length, color: "#f59e0b" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-white/10 bg-surface-raised p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="mt-1 text-sm text-white/50">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Front Desk Tools</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DEEP_LINKS.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-raised p-5 transition-colors hover:border-brand-400/50 hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-white/50">{description}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-white/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}
