"use client";

import { useState, useEffect, useCallback } from "react";
import { Utensils } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface DietOrder {
  id: string;
  stay: string;
  diet_type: string;
  allergies: string;
  is_active: boolean;
}
interface MealTrayTicket {
  id: string;
  diet_order: string;
  meal_type: string;
  scheduled_date: string;
  status: "scheduled" | "prepared" | "delivered" | "refused";
}
interface Paginated<T> { count: number; results: T[]; }

const DIET_TYPE_LABELS: Record<string, string> = {
  regular: "Regular", diabetic: "Diabetic", renal: "Renal", cardiac: "Cardiac (Low Sodium/Fat)",
  pureed: "Pureed", npo: "NPO (Nothing by Mouth)", clear_liquid: "Clear Liquid", full_liquid: "Full Liquid",
  low_sodium: "Low Sodium", gluten_free: "Gluten Free",
};

export default function DietaryPage() {
  const { session, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<DietOrder[] | null>(null);
  const [tickets, setTickets] = useState<MealTrayTicket[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [orderPage, ticketPage] = await Promise.all([
        apiFetch<Paginated<DietOrder>>("/api/v1/hospital/dietary/diet-orders/", opts),
        apiFetch<Paginated<MealTrayTicket>>("/api/v1/hospital/dietary/tray-tickets/", opts),
      ]);
      setOrders(orderPage.results);
      setTickets(ticketPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load dietary data."));
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function deliver(ticketId: string) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/dietary/tray-tickets/${ticketId}/deliver/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
      });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to mark tray delivered."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div role="alert" className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load dietary data</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (orders === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading...</div>;
  }

  const activeOrders = orders.filter(o => o.is_active);
  const pendingTickets = tickets.filter(t => t.status !== "delivered" && t.status !== "refused");

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Utensils size={22} /> Dietary &amp; Nutrition</h1>
          <p className="mt-1 text-sm text-ink/50">{activeOrders.length} active diet order(s), {pendingTickets.length} tray(s) pending</p>
        </div>
      </header>

      <div className="mb-6 overflow-hidden rounded-xl border border-ink/10 bg-surface-raised">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">Active Diet Orders</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {["Diet Type", "Allergies", ""].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-ink/50">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeOrders.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink/50">No active diet orders.</td></tr>}
              {activeOrders.map(o => (
                <tr key={o.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">{DIET_TYPE_LABELS[o.diet_type] ?? o.diet_type}</td>
                  <td className="px-4 py-3 text-ink/60">{o.allergies || "None documented"}</td>
                  <td className="px-4 py-3">
                    {o.diet_type === "npo" && <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">No trays -- NPO</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-surface-raised">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">Tray Tickets</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {["Meal", "Scheduled", "Status", "Action"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-ink/50">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/50">No tray tickets.</td></tr>}
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 capitalize">{t.meal_type}</td>
                  <td className="px-4 py-3 text-ink/60">{t.scheduled_date}</td>
                  <td className="px-4 py-3 capitalize text-ink/60">{t.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    {t.status !== "delivered" && t.status !== "refused" && (
                      <button disabled={busy} onClick={() => deliver(t.id)} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50">
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
