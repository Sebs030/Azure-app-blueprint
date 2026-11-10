import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { PageTitle } from "@/components/PageTitle";
import { SupplierForm } from "@/components/SupplierForm";
import { requireUser } from "@/lib/auth";
import { supplierRepo } from "@/lib/suppliers/repo";
import { SUPPLIER_FIELDS, type SupplierFormValues } from "@/lib/suppliers/schema";
import { updateSupplier } from "../../actions";

export const metadata = { title: "Lieferant bearbeiten · Intool" };

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supplier = await supplierRepo().get(id);
  if (!supplier) notFound();

  const initial = Object.fromEntries(
    SUPPLIER_FIELDS.map((f) => [f, supplier[f] ?? ""]),
  ) as SupplierFormValues;

  const changed = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(supplier.updated_at);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <PageTitle
        title={supplier.company_name}
        subtitle={`Zuletzt geändert am ${changed} von ${supplier.updated_by}`}
        backHref="/lieferanten"
      />
      <SupplierForm action={updateSupplier.bind(null, id)} initial={initial} submitLabel="Änderungen speichern" />
    </Container>
  );
}
