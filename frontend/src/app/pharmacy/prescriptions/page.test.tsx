import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PrescriptionsPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("PrescriptionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<PrescriptionsPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<PrescriptionsPage />);
    expect(
      screen.getByText("Prescription Verification Queue")
    ).toBeInTheDocument();
  });

  it("shows mock patient Fatima Al-Harbi from MOCK_PRESCRIPTIONS", () => {
    render(<PrescriptionsPage />);
    expect(screen.getByText("Fatima Al-Harbi")).toBeInTheDocument();
  });

  it("shows mock medication Warfarin 5mg from MOCK_PRESCRIPTIONS", () => {
    render(<PrescriptionsPage />);
    expect(screen.getByText("Warfarin 5mg")).toBeInTheDocument();
  });

  it("renders summary metric cards including Total and Drug Alerts", () => {
    render(<PrescriptionsPage />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Drug Alerts")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<PrescriptionsPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(
        screen.getByText("طابور مراجعة الوصفات الطبية")
      ).toBeInTheDocument();
    });
  });

  it("filtering by Verified status hides new-only prescriptions", async () => {
    render(<PrescriptionsPage />);
    // Fatima Al-Harbi is status=new; Yousef Al-Otaibi is status=verified
    expect(screen.getByText("Fatima Al-Harbi")).toBeInTheDocument();
    const verifiedBtn = screen.getByRole("button", { name: "Verified" });
    fireEvent.click(verifiedBtn);
    await waitFor(() => {
      expect(screen.queryByText("Fatima Al-Harbi")).not.toBeInTheDocument();
      expect(screen.getByText("Yousef Al-Otaibi")).toBeInTheDocument();
    });
  });

  it("clicking Verify on a new prescription shows action feedback", async () => {
    render(<PrescriptionsPage />);
    // Multiple Verify buttons exist (one per new prescription); pick the first
    const verifyBtns = screen.getAllByRole("button", { name: "Verify" });
    expect(verifyBtns.length).toBeGreaterThan(0);
    fireEvent.click(verifyBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Prescription verified/)).toBeInTheDocument();
    });
  });
});
