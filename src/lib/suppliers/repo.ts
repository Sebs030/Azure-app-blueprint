import { getDb, isSqlConfigured, withRetry } from "@/lib/db";
import type { Supplier, SupplierInput } from "./schema";
import { memoryRepo } from "./memory-repo";

export interface SupplierRepo {
  list(search?: string): Promise<Supplier[]>;
  get(id: number): Promise<Supplier | null>;
  create(input: SupplierInput, user: string): Promise<number>;
  update(id: number, input: SupplierInput, user: string): Promise<boolean>;
  remove(id: number): Promise<boolean>;
}

/** LIKE-Muster für SQL Server escapen ([, %, _). */
export const likePattern = (s: string) => `%${s.replace(/[[%_]/g, (c) => `[${c}]`)}%`;

const sqlRepo: SupplierRepo = {
  list: (search) =>
    withRetry(() => {
      let q = getDb().selectFrom("suppliers").selectAll().orderBy("company_name");
      const term = search?.trim();
      if (term) {
        const p = likePattern(term);
        q = q.where((eb) =>
          eb.or([eb("company_name", "like", p), eb("contact_name", "like", p), eb("city", "like", p), eb("category", "like", p)]),
        );
      }
      return q.execute() as Promise<Supplier[]>;
    }),

  get: (id) =>
    withRetry(async () => {
      const row = await getDb().selectFrom("suppliers").selectAll().where("id", "=", id).executeTakeFirst();
      return (row as Supplier | undefined) ?? null;
    }),

  create: (input, user) =>
    withRetry(async () => {
      const row = await getDb()
        .insertInto("suppliers")
        .values({ ...input, created_by: user, updated_by: user })
        .output("inserted.id")
        .executeTakeFirstOrThrow();
      return row.id;
    }),

  update: (id, input, user) =>
    withRetry(async () => {
      const res = await getDb()
        .updateTable("suppliers")
        .set((eb) => ({ ...input, updated_by: user, updated_at: eb.fn("sysutcdatetime") }))
        .where("id", "=", id)
        .executeTakeFirst();
      return Number(res.numUpdatedRows) > 0;
    }),

  remove: (id) =>
    withRetry(async () => {
      const res = await getDb().deleteFrom("suppliers").where("id", "=", id).executeTakeFirst();
      return Number(res.numDeletedRows) > 0;
    }),
};

/**
 * Azure SQL, sobald SQL_SERVER/SQL_DATABASE gesetzt sind.
 * Ohne SQL-Konfiguration nur lokal ein In-Memory-Speicher mit Demodaten – in Produktion nie.
 */
export function supplierRepo(): SupplierRepo {
  if (isSqlConfigured()) return sqlRepo;
  if (process.env.NODE_ENV !== "production") return memoryRepo;
  throw new Error("Datenbank nicht konfiguriert (SQL_SERVER / SQL_DATABASE fehlen).");
}
