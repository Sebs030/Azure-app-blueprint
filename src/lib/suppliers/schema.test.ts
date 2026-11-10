import { describe, expect, it } from "vitest";
import { supplierInput } from "./schema";

const base = {
  company_name: "  Muster GmbH ",
  category: "",
  vat_id: "",
  website: "",
  street: "",
  postal_code: "",
  city: "",
  country: "",
  contact_name: "",
  contact_role: "",
  email: "",
  phone: "",
  notes: "",
};

describe("supplierInput", () => {
  it("trimmt Werte, wandelt Leerstrings in null und setzt Deutschland als Land", () => {
    const r = supplierInput.parse(base);
    expect(r.company_name).toBe("Muster GmbH");
    expect(r.email).toBeNull();
    expect(r.country).toBe("Deutschland");
  });

  it("verlangt einen Firmennamen", () => {
    const r = supplierInput.safeParse({ ...base, company_name: " " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["company_name"]);
  });

  it("prüft E-Mail, Telefon, Website und USt-IdNr.", () => {
    const r = supplierInput.safeParse({
      ...base,
      email: "kein-mail",
      phone: "abc",
      website: "nicht eine url",
      vat_id: "123",
    });
    const fields = r.error?.issues.map((i) => i.path[0]).sort();
    expect(fields).toEqual(["email", "phone", "vat_id", "website"]);
  });

  it("akzeptiert gültige Kontaktdaten", () => {
    const r = supplierInput.safeParse({
      ...base,
      email: "einkauf@muster.de",
      phone: "+49 (0)30 123 45-6",
      website: "https://www.muster.de/kontakt",
      vat_id: "DE123456789",
    });
    expect(r.success).toBe(true);
  });
});
