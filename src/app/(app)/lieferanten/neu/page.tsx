import { Container } from "@mui/material";
import { PageTitle } from "@/components/PageTitle";
import { SupplierForm } from "@/components/SupplierForm";
import { requireUser } from "@/lib/auth";
import { createSupplier } from "../actions";

export const metadata = { title: "Neuer Lieferant · Intool" };

export default async function NewSupplierPage() {
  await requireUser();
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <PageTitle title="Neuer Lieferant" subtitle="Pflichtfeld ist nur der Firmenname." backHref="/lieferanten" />
      <SupplierForm action={createSupplier} submitLabel="Lieferant anlegen" />
    </Container>
  );
}
