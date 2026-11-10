import type { SupplierRepo } from "./repo";
import type { Supplier, SupplierInput } from "./schema";

// Nur für lokale Entwicklung ohne Azure SQL. Daten gehen beim Neustart verloren.

const empty: SupplierInput = {
  company_name: "",
  category: null,
  vat_id: null,
  website: null,
  street: null,
  postal_code: null,
  city: null,
  country: "Deutschland",
  contact_name: null,
  contact_role: null,
  email: null,
  phone: null,
  notes: null,
};

const seed: Partial<SupplierInput>[] = [
  {
    company_name: "Nordlicht Elektrotechnik GmbH",
    category: "Elektro",
    vat_id: "DE811234567",
    website: "nordlicht-elektro.example",
    street: "Speicherstraße 12",
    postal_code: "20457",
    city: "Hamburg",
    contact_name: "Jana Petersen",
    contact_role: "Vertrieb",
    email: "j.petersen@nordlicht-elektro.example",
    phone: "+49 40 123456-20",
  },
  {
    company_name: "Alpen Logistik AG",
    category: "Logistik",
    street: "Industriering 4",
    postal_code: "80939",
    city: "München",
    contact_name: "Thomas Huber",
    contact_role: "Key Account Manager",
    email: "t.huber@alpen-logistik.example",
    phone: "+49 89 9876543",
    notes: "Rahmenvertrag bis 12/2027",
  },
  {
    company_name: "Rheinwerk Facility Services",
    category: "Gebäudeservice",
    street: "Am Rheinufer 88",
    postal_code: "50668",
    city: "Köln",
    contact_name: "Aylin Demir",
    contact_role: "Objektleitung",
    email: "a.demir@rheinwerk-fs.example",
    phone: "+49 221 555010",
  },
];

declare global {
  var __suppliers: { rows: Supplier[]; nextId: number } | undefined;
}

function store() {
  if (!globalThis.__suppliers) {
    const now = new Date();
    globalThis.__suppliers = {
      rows: seed.map((s, i) => ({
        ...empty,
        ...s,
        id: i + 1,
        created_at: now,
        created_by: "seed",
        updated_at: now,
        updated_by: "seed",
      })),
      nextId: seed.length + 1,
    };
  }
  return globalThis.__suppliers;
}

const matches = (s: Supplier, term: string) =>
  [s.company_name, s.contact_name, s.city, s.category].some((v) => v?.toLowerCase().includes(term));

export const memoryRepo: SupplierRepo = {
  async list(search) {
    const term = search?.trim().toLowerCase();
    return store()
      .rows.filter((s) => !term || matches(s, term))
      .sort((a, b) => a.company_name.localeCompare(b.company_name, "de"));
  },
  async get(id) {
    return store().rows.find((s) => s.id === id) ?? null;
  },
  async create(input, user) {
    const st = store();
    const now = new Date();
    const id = st.nextId++;
    st.rows.push({ ...input, id, created_at: now, created_by: user, updated_at: now, updated_by: user });
    return id;
  },
  async update(id, input, user) {
    const row = store().rows.find((s) => s.id === id);
    if (!row) return false;
    Object.assign(row, input, { updated_at: new Date(), updated_by: user });
    return true;
  },
  async remove(id) {
    const st = store();
    const before = st.rows.length;
    st.rows = st.rows.filter((s) => s.id !== id);
    return st.rows.length < before;
  },
};
