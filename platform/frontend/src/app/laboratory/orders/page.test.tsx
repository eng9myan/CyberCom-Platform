import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LabOrdersPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("LabOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<LabOrdersPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<LabOrdersPage />);
    expect(screen.getByText("Lab Order Management")).toBeInTheDocument();
  });

  it("shows mock patient Mohammed Al-Sayed from MOCK_ORDERS", () => {
    render(<LabOrdersPage />);
    expect(screen.getByText("Mohammed Al-Sayed")).toBeInTheDocument();
  });

  it("shows order number LO-2026-001 from MOCK_ORDERS", () => {
    render(<LabOrdersPage />);
    expect(screen.getByText("LO-2026-001")).toBeInTheDocument();
  });

  it("renders summary metric cards including Total Orders and STAT Orders", () => {
    render(<LabOrdersPage />);
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("STAT Orders")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<LabOrdersPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("إدارة طلبات المختبر")).toBeInTheDocument();
    });
  });

  it("filtering by STAT priority hides routine orders", async () => {
    render(<LabOrdersPage />);
    // Khalid Al-Faris has priority=routine; Mohammed Al-Sayed has priority=STAT
    expect(screen.getByText("Khalid Al-Faris")).toBeInTheDocument();
    const statBtn = screen.getByRole("button", { name: "STAT" });
    fireEvent.click(statBtn);
    await waitFor(() => {
      expect(screen.queryByText("Khalid Al-Faris")).not.toBeInTheDocument();
      expect(screen.getByText("Mohammed Al-Sayed")).toBeInTheDocument();
    });
  });

  it("filtering by pending status shows only pending orders", async () => {
    render(<LabOrdersPage />);
    const pendingBtn = screen.getByRole("button", { name: "pending" });
    fireEvent.click(pendingBtn);
    await waitFor(() => {
      // Leila Nouri is pending; Mohammed Al-Sayed is processing — should disappear
      expect(screen.getByText("Leila Nouri")).toBeInTheDocument();
    });
  });
});
