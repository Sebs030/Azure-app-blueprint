import { z } from "zod";

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: maximal ${max} Zeichen`)
    .transform((v) => (v === "" ? null : v));

export const supplierInput = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "Bitte den Firmennamen angeben")
    .max(200, "Firmenname: maximal 200 Zeichen"),
  category: optional(100, "Kategorie"),
  vat_id: optional(20, "USt-IdNr.").refine(
    (v) => v === null || /^[A-Z]{2}[A-Z0-9+*]{2,13}$/.test(v.replace(/\s/g, "")),
    "USt-IdNr. im Format DE123456789",
  ),
  website: optional(254, "Website").refine(
    (v) => v === null || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v),
    "Bitte eine gültige Website angeben",
  ),
  street: optional(200, "Straße"),
  postal_code: optional(10, "PLZ"),
  city: optional(100, "Ort"),
  country: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || "Deutschland"),
  contact_name: optional(150, "Ansprechpartner"),
  contact_role: optional(100, "Funktion"),
  email: optional(254, "E-Mail").refine(
    (v) => v === null || z.email().safeParse(v).success,
    "Bitte eine gültige E-Mail-Adresse angeben",
  ),
  phone: optional(50, "Telefon").refine(
    (v) => v === null || /^[+\d][\d\s()/-]{4,}$/.test(v),
    "Bitte eine gültige Telefonnummer angeben",
  ),
  notes: optional(2000, "Notizen"),
});

export type SupplierInput = z.output<typeof supplierInput>;
export type SupplierFormValues = z.input<typeof supplierInput>;
export type SupplierField = keyof SupplierFormValues;

export const SUPPLIER_FIELDS = Object.keys(supplierInput.shape) as SupplierField[];

export type Supplier = SupplierInput & {
  id: number;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
};
