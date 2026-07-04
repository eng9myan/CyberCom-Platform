import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppointmentsPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("AppointmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<AppointmentsPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<AppointmentsPage />);
    expect(screen.getByText("Appointment Scheduling")).toBeInTheDocument();
  });

  it("shows mock patient Ahmed Al-Rashid from MOCK_APPOINTMENTS", () => {
    render(<AppointmentsPage />);
    expect(screen.getByText("Ahmed Al-Rashid")).toBeInTheDocument();
  });

  it("shows mock patient Sara Khalil from MOCK_APPOINTMENTS", () => {
    render(<AppointmentsPage />);
    expect(screen.getByText("Sara Khalil")).toBeInTheDocument();
  });

  it("renders summary metric cards including Total and Scheduled", () => {
    render(<AppointmentsPage />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    // "Scheduled" appears in the metric card label AND in status badges for every scheduled appointment
    const scheduledEls = screen.getAllByText("Scheduled");
    expect(scheduledEls.length).toBeGreaterThan(0);
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<AppointmentsPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("جدولة المواعيد")).toBeInTheDocument();
    });
  });

  it("Confirm button on a scheduled appointment triggers action feedback message", async () => {
    render(<AppointmentsPage />);
    const confirmBtns = screen.getAllByRole("button", { name: "Confirm" });
    expect(confirmBtns.length).toBeGreaterThan(0);
    fireEvent.click(confirmBtns[0]);
    // Action message format: "Appointment APT-XXX confirmed."
    await waitFor(() => {
      expect(screen.getByText(/^Appointment APT-.+ confirmed\.$/)).toBeInTheDocument();
    });
  });

  it("Cancel button removes the appointment from the actionable queue", async () => {
    render(<AppointmentsPage />);
    // Scheduled/confirmed appointments show a Cancel button; cancelling removes it
    const initialCancelCount = screen.getAllByRole("button", { name: "Cancel" }).length;
    expect(initialCancelCount).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    await waitFor(() => {
      // After cancel the appointment status changes so its Cancel button disappears
      expect(screen.getAllByRole("button", { name: "Cancel" }).length).toBe(
        initialCancelCount - 1
      );
    });
  });
});
