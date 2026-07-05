import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EmergencyPage from "./page";
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
  email: "ed@cy-com.com",
  realm: "cybercom",
  tenantId: "tenant-1",
  roles: [],
  permissions: [],
  accessToken: "token",
  tokenExpiresAt: Date.now() + 60_000,
};

function mockEDResponses() {
  mockedApiFetch.mockImplementation((path: string) => {
    if (path.includes("/visits/")) {
      return Promise.resolve({
        count: 1,
        results: [{
          id: "visit-1", patient: "pat-1", arrival_time: new Date().toISOString(),
          arrival_method: "walk-in", presenting_complaint: "Chest pain", status: "resuscitation",
        }],
      });
    }
    if (path.includes("/triage/")) {
      return Promise.resolve({
        count: 1,
        results: [{ id: "tri-1", visit: "visit-1", esi_level: 1, chief_complaint: "Chest pain", logged_at: new Date().toISOString() }],
      });
    }
    if (path.includes("/observations/")) {
      return Promise.resolve({ count: 0, results: [] });
    }
    if (path.includes("/tracking/")) {
      return Promise.resolve({ count: 0, results: [] });
    }
    if (path.includes("/api/v1/patients/")) {
      return Promise.resolve({
        count: 1,
        results: [{ id: "pat-1", first_name: "Fahad", last_name: "Al-Qahtani", mrn: "MRN-001", dob: "1968-01-01", gender: "male" }],
      });
    }
    return Promise.reject(new Error(`unexpected path: ${path}`));
  });
}

describe("EmergencyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a sign-in prompt when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({ session: null, isAuthenticated: false, setSession: vi.fn(), logout: vi.fn() });
    render(<EmergencyPage />);
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("loads and displays real ED visit data when authenticated", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockEDResponses();
    render(<EmergencyPage />);

    await waitFor(() => {
      expect(screen.getByText("Fahad Al-Qahtani")).toBeInTheDocument();
    });
    expect(screen.getByText("ESI Triage Level Distribution")).toBeInTheDocument();
  });

  it("shows an explicit error state when the API call fails, never falls back to mock data", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockedApiFetch.mockRejectedValue(new Error("API unavailable"));
    render(<EmergencyPage />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load emergency department data")).toBeInTheDocument();
    });
    expect(screen.queryByText("Fahad Al-Qahtani")).not.toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockEDResponses();
    render(<EmergencyPage />);

    await waitFor(() => {
      expect(screen.getByText("Emergency Department")).toBeInTheDocument();
    });
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("قسم الطوارئ")).toBeInTheDocument();
    });
  });

  it("filtering by ESI level narrows the visible visits", async () => {
    mockedUseAuth.mockReturnValue({ session: SESSION, isAuthenticated: true, setSession: vi.fn(), logout: vi.fn() });
    mockEDResponses();
    render(<EmergencyPage />);

    await waitFor(() => {
      expect(screen.getByText("Fahad Al-Qahtani")).toBeInTheDocument();
    });
    const esi5Btn = screen.getByRole("button", { name: "ESI 5" });
    fireEvent.click(esi5Btn);
    await waitFor(() => {
      expect(screen.queryByText("Fahad Al-Qahtani")).not.toBeInTheDocument();
    });
  });
});
