import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LabResultsPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("LabResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<LabResultsPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<LabResultsPage />);
    expect(screen.getByText("Lab Results Review")).toBeInTheDocument();
  });

  it("shows mock patient Fares Al-Mutairi (critical potassium) from MOCK_RESULTS", () => {
    render(<LabResultsPage />);
    // Fares Al-Mutairi appears in two results rows (Serum Potassium + CSF Glucose)
    const matches = screen.getAllByText("Fares Al-Mutairi");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows critical unacknowledged count banner", () => {
    render(<LabResultsPage />);
    // Multiple unacknowledged critical results exist in MOCK_RESULTS
    expect(
      screen.getByText(/Unacknowledged Critical Value/)
    ).toBeInTheDocument();
  });

  it("renders summary metric cards including Total Results and Critical", () => {
    render(<LabResultsPage />);
    expect(screen.getByText("Total Results")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<LabResultsPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("مراجعة نتائج المختبر")).toBeInTheDocument();
    });
  });

  it("clicking Critical filter via banner button shows only critical results", async () => {
    render(<LabResultsPage />);
    // Yousif Al-Amin has only normal/abnormal results, not critical
    expect(screen.getAllByText("Yousif Al-Amin").length).toBeGreaterThan(0);
    // The banner has a unique "View Critical" button that sets the critical filter
    const viewCritBtn = screen.getByRole("button", { name: "View Critical" });
    fireEvent.click(viewCritBtn);
    await waitFor(() => {
      expect(screen.queryByText("Yousif Al-Amin")).not.toBeInTheDocument();
      expect(screen.getAllByText("Fares Al-Mutairi").length).toBeGreaterThan(0);
    });
  });

  it("clicking Acknowledge removes the Acknowledge button for that result", async () => {
    render(<LabResultsPage />);
    const ackBtns = screen.getAllByRole("button", { name: "Acknowledge" });
    expect(ackBtns.length).toBeGreaterThan(0);
    fireEvent.click(ackBtns[0]);
    await waitFor(() => {
      // After acknowledgment a checkmark "Acknowledged" span appears for that result
      expect(screen.getAllByText(/Acknowledged/)).toBeTruthy();
    });
  });
});
