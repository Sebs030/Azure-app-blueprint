"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import type { SupplierFormState } from "@/app/(app)/lieferanten/actions";
import type { SupplierField, SupplierFormValues } from "@/lib/suppliers/schema";

type Props = {
  action: (prev: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
  initial?: Partial<SupplierFormValues>;
  submitLabel: string;
};

type FieldDef = {
  name: SupplierField;
  label: string;
  size?: { xs: number; sm?: number; md?: number };
  type?: string;
  required?: boolean;
  multiline?: boolean;
  autoComplete?: string;
  placeholder?: string;
};

const sections: { title: string; hint: string; fields: FieldDef[] }[] = [
  {
    title: "Unternehmen",
    hint: "Stammdaten des Lieferanten",
    fields: [
      { name: "company_name", label: "Firmenname", required: true, size: { xs: 12, md: 8 }, autoComplete: "organization" },
      { name: "category", label: "Kategorie", size: { xs: 12, md: 4 }, placeholder: "z. B. Logistik" },
      { name: "vat_id", label: "USt-IdNr.", size: { xs: 12, sm: 6 }, placeholder: "DE123456789" },
      { name: "website", label: "Website", size: { xs: 12, sm: 6 }, placeholder: "www.beispiel.de", autoComplete: "url" },
    ],
  },
  {
    title: "Anschrift",
    hint: "Postanschrift bzw. Firmensitz",
    fields: [
      { name: "street", label: "Straße und Hausnummer", size: { xs: 12 }, autoComplete: "street-address" },
      { name: "postal_code", label: "PLZ", size: { xs: 4, md: 3 }, autoComplete: "postal-code" },
      { name: "city", label: "Ort", size: { xs: 8, md: 5 }, autoComplete: "address-level2" },
      { name: "country", label: "Land", size: { xs: 12, md: 4 }, autoComplete: "country-name" },
    ],
  },
  {
    title: "Ansprechpartner",
    hint: "Primärer Kontakt beim Lieferanten",
    fields: [
      { name: "contact_name", label: "Name", size: { xs: 12, sm: 6 }, autoComplete: "name" },
      { name: "contact_role", label: "Funktion", size: { xs: 12, sm: 6 }, placeholder: "z. B. Vertrieb" },
      { name: "email", label: "E-Mail", type: "email", size: { xs: 12, sm: 6 }, autoComplete: "email" },
      { name: "phone", label: "Telefon", type: "tel", size: { xs: 12, sm: 6 }, autoComplete: "tel" },
    ],
  },
  {
    title: "Notizen",
    hint: "Konditionen, Verträge, Besonderheiten",
    fields: [{ name: "notes", label: "Notizen", multiline: true, size: { xs: 12 } }],
  },
];

export function SupplierForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initial ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    // key: nach einer Validierung die neuen Default-Werte übernehmen
    <form action={formAction} noValidate key={JSON.stringify(state.values ?? null)}>
      <Stack spacing={2.5}>
        {state.formError && <Alert severity="error">{state.formError}</Alert>}
        {Object.keys(errors).length > 0 && (
          <Alert severity="warning">Bitte die markierten Felder prüfen.</Alert>
        )}

        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="h6" component="h2">
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {section.hint}
              </Typography>
              <Grid container spacing={2}>
                {section.fields.map((f) => (
                  <Grid key={f.name} size={f.size ?? { xs: 12 }}>
                    <TextField
                      name={f.name}
                      label={f.label}
                      type={f.type ?? "text"}
                      required={f.required}
                      defaultValue={values[f.name] ?? (f.name === "country" ? "Deutschland" : "")}
                      error={Boolean(errors[f.name])}
                      helperText={errors[f.name]}
                      placeholder={f.placeholder}
                      autoComplete={f.autoComplete ?? "off"}
                      multiline={f.multiline}
                      minRows={f.multiline ? 4 : undefined}
                      disabled={pending}
                      fullWidth
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button component={Link} href="/lieferanten" variant="outlined" disabled={pending}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {pending ? "Speichern …" : submitLabel}
          </Button>
        </Box>
        {pending && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
            Die Datenbank kann nach einer Pause bis zu einer Minute zum Aufwachen brauchen.
          </Typography>
        )}
      </Stack>
    </form>
  );
}
