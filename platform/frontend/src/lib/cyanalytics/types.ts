/**
 * CyAnalytics — shared types for the cross-product Command Center engine.
 * Drill-down path: network -> hospital -> department -> doctor -> patient.
 * "network" (multi-hospital aggregation) is backed by HealthGroupViewSet
 * (/api/v1/tenants/health-groups/), gated to executive roles
 * (platform_admin/group_ceo/group_board_member/group_cfo). A user without
 * one of those roles legitimately sees "no group access" -- that's a real
 * permission boundary, not an unimplemented feature.
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

/** Mirrors MedicalDirectorService.get_dashboard(). */
export interface MedicalDirectorDashboard {
  period_days: number;
  discharge_count: number;
  avg_length_of_stay_days: number | null;
  mortality_rate_percent: number | null;
  mortality_count: number;
  readmission_rate_percent: number | null;
  readmission_count: number;
  bed_occupancy_percentage: number;
  icu_critical_events_count: number;
  consultant_productivity: { admitting_physician_id: string; admission_count: number }[];
}

/** Mirrors HealthGroupSerializer. */
export interface HealthGroupSummary {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  tenant_count: number;
}

/** Mirrors get_group_snapshot() (platform/tenant/health_group_service.py). */
export interface HospitalGroupRow {
  tenant_id: string;
  tenant_name: string;
  active_admissions?: number;
  current_occupied_beds?: number;
  total_beds?: number;
  bed_occupancy_percentage?: number;
  emergency_waiting?: number;
  icu_occupancy?: number;
  invoices_outstanding?: number;
  patients_total?: number;
  error?: string;
}

export interface HealthGroupSnapshot {
  group_id: string;
  group_name: string;
  hospital_count: number;
  totals: {
    active_admissions: number;
    current_occupied_beds: number;
    total_beds: number;
    emergency_waiting: number;
    icu_occupancy: number;
    invoices_outstanding: number;
    patients_total: number;
    group_bed_occupancy_percentage: number | null;
  };
  hospitals: HospitalGroupRow[];
}

export interface DepartmentTile {
  id: string;
  name: string;
  href: string;
  icon: string;
  status: "live" | "coming_soon";
}
