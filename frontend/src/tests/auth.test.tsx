import { describe, it, expect } from "vitest";
import { parseJwtClaims } from "@/lib/auth";

describe("auth utilities", () => {
  it("parses JWT payload claims", () => {
    const payload = { sub: "user-123", email: "test@cy.io" };
    const encoded = btoa(JSON.stringify(payload));
    const token = `header.${encoded}.signature`;
    const claims = parseJwtClaims(token);
    expect(claims["sub"]).toBe("user-123");
    expect(claims["email"]).toBe("test@cy.io");
  });

  it("returns empty object for invalid token", () => {
    const claims = parseJwtClaims("invalid");
    expect(claims).toEqual({});
  });
});
