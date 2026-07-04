import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EmergencyPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("EmergencyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<EmergencyPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<EmergencyPage />);
    expect(screen.getByText("Emergency Department")).toBeInTheDocument();
  });

  it("shows mock patient Fahad Al-Qahtani (ESI-1 STEMI) from MOCK_PATIENTS", () => {
    render(<EmergencyPage />);
    expect(screen.getByText("Fahad Al-Qahtani")).toBeInTheDocument();
  });

  it("shows mock patient Hessa Al-Enezi (ESI-1 anaphylaxis) from MOCK_PATIENTS", () => {
    render(<EmergencyPage />);
    expect(screen.getByText("Hessa Al-Enezi")).toBeInTheDocument();
  });

  it("renders summary metric cards including Total Patients and Boarding", () => {
    render(<EmergencyPage />);
    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    // "Boarding" appears in metric card label, status filter button, and patient rows
    const boardingEls = screen.getAllByText("Boarding");
    expect(boardingEls.length).toBeGreaterThan(0);
  });

  it("displays ESI Triage Level Distribution section", () => {
    render(<EmergencyPage />);
    expect(
      screen.getByText("ESI Triage Level Distribution")
    ).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<EmergencyPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("قسم الطوارئ")).toBeInTheDocument();
    });
  });

  it("filtering by ESI 1 hides ESI-3 and lower patients", async () => {
    render(<EmergencyPage />);
    // Tariq Bin Salim is ESI-3; Fahad Al-Qahtani is ESI-1
    expect(screen.getByText("Tariq Bin Salim")).toBeInTheDocument();
    const esi1Btn = screen.getByRole("button", { name: "ESI 1" });
    fireEvent.click(esi1Btn);
    await waitFor(() => {
      expect(screen.queryByText("Tariq Bin Salim")).not.toBeInTheDocument();
      expect(screen.getByText("Fahad Al-Qahtani")).toBeInTheDocument();
    });
  });
});
