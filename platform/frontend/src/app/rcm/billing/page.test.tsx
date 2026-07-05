import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RCMBilling from "./page";
import { useAuth } from "@/contexts/auth";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/contexts/auth", () => ({
  useAuth: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);
const mockedUseAuth = vi.mocked(useAuth);

const SESSION = {
  userId: "u1",
  email: "billing@cy-com.com",
  realm: "cybercom",
  tenantId: "tenant-1",
  roles: [],
  permissions: [],
  accessToken: "token",
  tokenExpiresAt: Date.now() + 60_000,
};

function mockBillingResponses() {
  mockedApiFetch.mockImplementation((path: string) => {
    if (path.includes("patient-accounts")) {
      return Promise.resolve({
        count: 1,
        results: [{ id: "acct-1", patient_id: "pat-1", account_number: "ACC-001", account_status: "active", outstanding_balance: "100.00" }],
      });
    }
    if (path.includes("encounter-billings")) {
      return Promise.resolve({
        count: 1,
        results: [{
          id: "enc-1", patient_account: "acct-1", encounter_id: "e1", encounter_type: "outpatient",
          encounter_date: "2026-07-01", billing_status: "open", total_charges: "500.00",
          balance_due: "500.00", icd11_primary_diagnosis: "E11.9",
        }],
      });
    }
    if (path.includes("invoices")) {
      return Promise.resolve({ count: 0, results: [] });
    }
    if (path.includes("/api/v1/patients/")) {
      return Promise.resolve({
        count: 1,
        results: [{ id: "pat-1", first_name: "Ahmad", last_name: "Al-Rashidi", mrn: "MRN-001" }],
      });
    }
    return Promise.reject(new Error(`unexpected path: ${path}`));
  });
}

describe("RCMBilling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a sign-in prompt when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({ session: null, isAuthenticated: false, setSession: vi.fn(), logout: vi.fn() });
    render(<RCMBilling />);
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("loads and displays real encounter billing data when authenticated", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockBillingResponses();
    render(<RCMBilling />);

    await waitFor(() => {
      expect(screen.getByText("Ahmad Al-Rashidi (MRN-001)")).toBeInTheDocument();
    });
    expect(screen.getByText("E11.9")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("shows an explicit error state when the API call fails, never falls back to mock data", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockedApiFetch.mockRejectedValue(new Error("API unavailable"));
    render(<RCMBilling />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load billing data")).toBeInTheDocument();
    });
    expect(screen.queryByText("Ahmad Al-Rashidi")).not.toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockBillingResponses();
    render(<RCMBilling />);

    await waitFor(() => {
      expect(screen.getByText("Billing & Charge Capture")).toBeInTheDocument();
    });
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("الفوترة وتسجيل الرسوم")).toBeInTheDocument();
    });
  });

  it("filtering by status shows only matching encounters", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockBillingResponses();
    render(<RCMBilling />);

    await waitFor(() => {
      expect(screen.getByText("Ahmad Al-Rashidi (MRN-001)")).toBeInTheDocument();
    });
    const paidBtn = screen.getByRole("button", { name: /^paid/i });
    fireEvent.click(paidBtn);
    await waitFor(() => {
      expect(screen.getByText(/No encounter billing records for this filter/)).toBeInTheDocument();
    });
  });
});
