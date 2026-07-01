import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RCMBilling from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("RCMBilling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<RCMBilling />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<RCMBilling />);
    expect(screen.getByText("Billing & Charge Capture")).toBeInTheDocument();
  });

  it("shows mock patient Ahmad Al-Rashidi (ENC-001 unbilled) from ENCOUNTERS", () => {
    render(<RCMBilling />);
    // Ahmad Al-Rashidi appears in multiple encounters; getAllByText to avoid error
    const matches = screen.getAllByText("Ahmad Al-Rashidi");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows encounter ID ENC-001 from ENCOUNTERS", () => {
    render(<RCMBilling />);
    expect(screen.getByText("ENC-001")).toBeInTheDocument();
  });

  it("renders revenue metric cards including Unbilled, Billed, and A/R Days", () => {
    render(<RCMBilling />);
    expect(screen.getByText("Unbilled")).toBeInTheDocument();
    expect(screen.getByText("Billed")).toBeInTheDocument();
    expect(screen.getByText("A/R Days")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<RCMBilling />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("الفوترة وتسجيل الرسوم")).toBeInTheDocument();
    });
  });

  it("filtering by Unbilled shows only unbilled encounters", async () => {
    render(<RCMBilling />);
    // ENC-002 is pending (Mariam Al-Harbi); ENC-001 is unbilled (Ahmad Al-Rashidi)
    const unbilledBtn = screen.getByRole("button", { name: /Unbilled/i });
    fireEvent.click(unbilledBtn);
    await waitFor(() => {
      // ENC-001 (unbilled) should be visible; ENC-002 (pending) should not
      expect(screen.getByText("ENC-001")).toBeInTheDocument();
      expect(screen.queryByText("ENC-002")).not.toBeInTheDocument();
    });
  });

  it("selecting a checkbox shows header Submit button and clicking it clears selection", async () => {
    render(<RCMBilling />);
    // Multiple checkboxes exist (one per non-submitted encounter)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
    // Select the first checkbox
    fireEvent.click(checkboxes[0]);
    await waitFor(() => {
      // Header Submit button includes "SAR" in its label; per-row buttons say just "Submit"
      // This uniquely identifies the header bulk-submit button
      const headerSubmit = screen.getByRole("button", { name: /SAR/ });
      expect(headerSubmit).toBeInTheDocument();
    });
    // Click the header Submit button (contains "SAR" in its text)
    const headerSubmit = screen.getByRole("button", { name: /SAR/ });
    fireEvent.click(headerSubmit);
    await waitFor(() => {
      // After submit, selection is cleared so the header Submit button (with SAR) disappears
      expect(screen.queryByRole("button", { name: /SAR/ })).not.toBeInTheDocument();
    });
  });
});
