// Führt Kysely-Migrationen aus db/migrations aus.
// Läuft LOKAL durch den Entwickler als Entra-Admin des SQL Servers (az login), nicht in CI.
//   npm run db:migrate          → alle offenen Migrationen
//   npm run db:migrate -- down  → letzte Migration zurückrollen
import { promises as fs } from "node:fs";
import path from "node:path";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { createDb } from "../src/lib/db";

async function main() {
  const db = createDb();
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), "db", "migrations"),
    }),
  });

  const { error, results } =
    process.argv[2] === "down" ? await migrator.migrateDown() : await migrator.migrateToLatest();

  for (const r of results ?? []) {
    console.log(`${r.status === "Success" ? "✓" : "✗"} ${r.direction} ${r.migrationName} (${r.status})`);
  }
  if (!results?.length) console.log("Keine offenen Migrationen.");
  await db.destroy();
  if (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
