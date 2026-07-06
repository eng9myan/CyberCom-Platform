/**
 * CyAnalytics — shared types for the cross-product Command Center engine.
 * Drill-down path: network -> hospital -> department -> doctor -> patient.
 * "network" (multi-hospital aggregation) has no backend yet -- deployments
 * today are single-tenant, so that level is modeled but always reports
 * `available: false` rather than fabricated cross-hospital numbers.
 */

export type DrillLevel = "network" | "hospital" | "department" | "doctor" | "patient";

export interface DrillNode {
  level: DrillLevel;
  id: string;
  label: string;
}

export type DrillPath = DrillNode[];

export interface KpiResult<T> {
  data: T | null;
  available: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  unavailableReason?: string;
}

/** Mirrors ClinicalCommandCenterMetricsView response (hospital/services.py). */
export interface HospitalCensusSnapshot {
  operational_census: {
    active_admissions: number;
    current_occupied_beds: number;
    total_beds: number;
    emergency_waiting: number;
    icu_occupancy: number;
    scheduled_procedures_today: number;
  };
  capacity_indicators: { bed_occupancy_percentage: number };
}

/** Mirrors HospitalOperationsService.get_module_summary(). */
export interface HospitalModuleSummary {
  patients_total: number;
  appointments_today: number;
  providers_active: number;
  invoices_outstanding: number;
  stock_items_out_of_stock: number;
  leave_requests_pending: number;
  bi_reports_active: number;
}

export interface DepartmentTile {
  id: string;
  name: string;
  href: string;
  icon: string;
  status: "live" | "coming_soon";
}
