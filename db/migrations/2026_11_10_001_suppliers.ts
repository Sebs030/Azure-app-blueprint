import { sql, type Kysely } from "kysely";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("suppliers")
    .addColumn("id", "integer", (c) => c.identity().primaryKey())
    .addColumn("company_name", sql`nvarchar(200)`, (c) => c.notNull())
    .addColumn("category", sql`nvarchar(100)`)
    .addColumn("vat_id", sql`nvarchar(20)`)
    .addColumn("website", sql`nvarchar(254)`)
    .addColumn("street", sql`nvarchar(200)`)
    .addColumn("postal_code", sql`nvarchar(10)`)
    .addColumn("city", sql`nvarchar(100)`)
    .addColumn("country", sql`nvarchar(100)`, (c) => c.notNull().defaultTo("Deutschland"))
    .addColumn("contact_name", sql`nvarchar(150)`)
    .addColumn("contact_role", sql`nvarchar(100)`)
    .addColumn("email", sql`nvarchar(254)`)
    .addColumn("phone", sql`nvarchar(50)`)
    .addColumn("notes", sql`nvarchar(2000)`)
    .addColumn("created_at", sql`datetime2`, (c) => c.notNull().defaultTo(sql`sysutcdatetime()`))
    .addColumn("created_by", sql`nvarchar(200)`, (c) => c.notNull())
    .addColumn("updated_at", sql`datetime2`, (c) => c.notNull().defaultTo(sql`sysutcdatetime()`))
    .addColumn("updated_by", sql`nvarchar(200)`, (c) => c.notNull())
    .execute();

  await db.schema.createIndex("ix_suppliers_company_name").on("suppliers").column("company_name").execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("suppliers").execute();
}
