import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReceptionPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("ReceptionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<ReceptionPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<ReceptionPage />);
    expect(screen.getByText("Reception Desk")).toBeInTheDocument();
  });

  it("shows mock patient Ahmed Al-Rashid from MOCK_WAITING", () => {
    render(<ReceptionPage />);
    expect(screen.getByText("Ahmed Al-Rashid")).toBeInTheDocument();
  });

  it("shows mock patient Sara Khalil from MOCK_WAITING", () => {
    render(<ReceptionPage />);
    expect(screen.getByText("Sara Khalil")).toBeInTheDocument();
  });

  it("renders summary metric cards including Waiting Now and No-shows", () => {
    render(<ReceptionPage />);
    expect(screen.getByText("Waiting Now")).toBeInTheDocument();
    expect(screen.getByText("No-shows")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<ReceptionPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("مكتب الاستقبال")).toBeInTheDocument();
    });
  });

  it("Call button on a waiting patient shows action feedback", async () => {
    render(<ReceptionPage />);
    // Ahmed Al-Rashid is status=waiting and has a Call button
    const callBtns = screen.getAllByRole("button", { name: "Call" });
    expect(callBtns.length).toBeGreaterThan(0);
    fireEvent.click(callBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/called to the desk/)).toBeInTheDocument();
    });
  });

  it("filter by Waiting hides in_consultation patients", async () => {
    render(<ReceptionPage />);
    // Khalid Al-Nouri is in_consultation; Ahmed Al-Rashid is waiting
    expect(screen.getByText("Khalid Al-Nouri")).toBeInTheDocument();
    const waitingBtn = screen.getByRole("button", { name: "Waiting" });
    fireEvent.click(waitingBtn);
    await waitFor(() => {
      expect(screen.queryByText("Khalid Al-Nouri")).not.toBeInTheDocument();
      expect(screen.getByText("Ahmed Al-Rashid")).toBeInTheDocument();
    });
  });
});
