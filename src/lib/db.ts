import { Kysely, MssqlDialect, type Generated } from "kysely";
import * as Tedious from "tedious";
import * as Tarn from "tarn";

export interface SupplierTable {
  id: Generated<number>;
  company_name: string;
  category: string | null;
  vat_id: string | null;
  website: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  created_by: string;
  updated_at: Generated<Date>;
  updated_by: string;
}

export interface Database {
  suppliers: SupplierTable;
}

/**
 * Ein Codepfad für lokal und Azure: "azure-active-directory-default" nutzt lokal
 * `az login`, in Azure die System-assigned Managed Identity. Kein Passwort.
 */
export function createDb(): Kysely<Database> {
  const server = process.env.SQL_SERVER;
  const database = process.env.SQL_DATABASE;
  if (!server || !database) throw new Error("SQL_SERVER und SQL_DATABASE müssen gesetzt sein.");

  return new Kysely<Database>({
    dialect: new MssqlDialect({
      tarn: { ...Tarn, options: { min: 0, max: 5 } },
      tedious: {
        ...Tedious,
        connectionFactory: () =>
          new Tedious.Connection({
            server,
            authentication: { type: "azure-active-directory-default", options: {} },
            options: {
              database,
              encrypt: true,
              port: 1433,
              connectTimeout: 60_000, // Serverless-DB braucht nach Pause bis ~1 Min zum Aufwachen
              requestTimeout: 30_000,
            },
          }),
      },
    }),
  });
}

declare global {
  var __db: Kysely<Database> | undefined;
}

export function getDb(): Kysely<Database> {
  return (globalThis.__db ??= createDb());
}

export const isSqlConfigured = () => Boolean(process.env.SQL_SERVER && process.env.SQL_DATABASE);

/** Fehlercodes, die beim Aufwachen einer pausierten Serverless-DB bzw. bei Failover auftreten. */
const TRANSIENT_NUMBERS = new Set([4060, 4221, 10928, 10929, 40197, 40501, 40613, 49918, 49919, 49920]);
const TRANSIENT_CODES = new Set(["ETIMEOUT", "ESOCKET", "ECONNRESET", "ECONNCLOSED"]);

export function isTransientSqlError(err: unknown): boolean {
  let e: unknown = err;
  for (let depth = 0; e && typeof e === "object" && depth < 4; depth++) {
    const { number, code, message } = e as { number?: number; code?: string; message?: string };
    if (typeof number === "number" && TRANSIENT_NUMBERS.has(number)) return true;
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true;
    if (typeof message === "string" && /\b(40613|40197|40501|49918|49919|49920)\b/.test(message)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/** Wiederholt transiente Fehler (Resume-from-pause) mit festem Backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 5, delayMs = 5_000 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts || !isTransientSqlError(err)) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
