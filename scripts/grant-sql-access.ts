// Legt für Managed Identities einen Datenbank-User an und vergibt Lese-/Schreibrechte.
// Nur als Entra-Admin des SQL Servers ausführbar (az login, eigene IP in der SQL-Firewall).
//   npm run db:grant -- <web-app-name> [<function-app-name> ...]
import { sql } from "kysely";
import { createDb } from "../src/lib/db";

async function main() {
  const names = process.argv.slice(2);
  if (!names.length) {
    console.error("Nutzung: npm run db:grant -- <web-app-name> [<weitere-identität> ...]");
    process.exit(1);
  }
  const db = createDb();
  for (const name of names) {
    // Identifier lassen sich nicht parametrisieren → strikt validieren.
    if (!/^[A-Za-z0-9-]{2,60}$/.test(name)) throw new Error(`Ungültiger Name: ${name}`);
    const id = sql.raw(`[${name}]`);
    await sql`IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = ${name})
              CREATE USER ${id} FROM EXTERNAL PROVIDER;`.execute(db);
    await sql`ALTER ROLE db_datareader ADD MEMBER ${id};`.execute(db);
    await sql`ALTER ROLE db_datawriter ADD MEMBER ${id};`.execute(db);
    console.log(`✓ ${name}: db_datareader + db_datawriter`);
  }
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
