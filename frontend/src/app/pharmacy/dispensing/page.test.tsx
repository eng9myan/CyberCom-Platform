import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DispensingPage from "./page";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable")),
}));

describe("DispensingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<DispensingPage />);
    expect(document.body).toBeTruthy();
  });

  it("displays the page heading in English", () => {
    render(<DispensingPage />);
    expect(screen.getByText("Dispensing Queue")).toBeInTheDocument();
  });

  it("shows mock patient Yousef Al-Otaibi from MOCK_QUEUE", () => {
    render(<DispensingPage />);
    expect(screen.getByText("Yousef Al-Otaibi")).toBeInTheDocument();
  });

  it("shows mock medication Amoxicillin 500mg Capsules from MOCK_QUEUE", () => {
    render(<DispensingPage />);
    expect(screen.getByText("Amoxicillin 500mg Capsules")).toBeInTheDocument();
  });

  it("renders Pending Dispense and Total in Queue metric cards", () => {
    render(<DispensingPage />);
    expect(screen.getByText("Pending Dispense")).toBeInTheDocument();
    expect(screen.getByText("Total in Queue")).toBeInTheDocument();
  });

  it("language toggle switches heading to Arabic", async () => {
    render(<DispensingPage />);
    const langBtn = screen.getByText("العربية");
    fireEvent.click(langBtn);
    await waitFor(() => {
      expect(screen.getByText("طابور صرف الأدوية")).toBeInTheDocument();
    });
  });

  it("language toggle switches metric labels to Arabic", async () => {
    render(<DispensingPage />);
    fireEvent.click(screen.getByText("العربية"));
    await waitFor(() => {
      expect(screen.getByText("بانتظار الصرف")).toBeInTheDocument();
    });
  });

  it("shows bin location label A-12 for first queue item", () => {
    render(<DispensingPage />);
    expect(screen.getByText("A-12")).toBeInTheDocument();
  });
});
