import { describe, expect, it } from "vitest";
import { firstName, greeting, initials } from "./format";

describe("format", () => {
  it("bildet Initialen aus Namen und E-Mail-Adressen", () => {
    expect(initials("Erika Musterfrau")).toBe("EM");
    expect(initials("max.mustermann@contoso.com")).toBe("MM");
    expect(initials("")).toBe("?");
  });

  it("ermittelt den Vornamen", () => {
    expect(firstName("Erika Musterfrau")).toBe("Erika");
    expect(firstName("max.mustermann@contoso.com")).toBe("Max");
  });

  it("begrüßt abhängig von der Uhrzeit in Berlin", () => {
    expect(greeting(new Date("2026-01-15T07:00:00Z"))).toBe("Guten Morgen");
    expect(greeting(new Date("2026-01-15T12:00:00Z"))).toBe("Guten Tag");
    expect(greeting(new Date("2026-01-15T19:00:00Z"))).toBe("Guten Abend");
  });
});
