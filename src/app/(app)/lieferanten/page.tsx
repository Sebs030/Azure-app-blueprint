import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddRounded from "@mui/icons-material/AddRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LanguageRounded from "@mui/icons-material/LanguageRounded";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { DeleteSupplierButton } from "@/components/DeleteSupplierButton";
import { requireUser } from "@/lib/auth";
import { isSqlConfigured } from "@/lib/db";
import { supplierRepo } from "@/lib/suppliers/repo";
import type { Supplier } from "@/lib/suppliers/schema";

export const metadata = { title: "Lieferanten · Intool" };

type Props = { searchParams: Promise<{ q?: string; saved?: string }> };

export default async function SuppliersPage({ searchParams }: Props) {
  await requireUser();
  const { q, saved } = await searchParams;
  const search = q?.slice(0, 100);

  let suppliers: Supplier[] = [];
  let loadError = false;
  try {
    suppliers = await supplierRepo().list(search);
  } catch (err) {
    console.error("Lieferanten laden fehlgeschlagen", err);
    loadError = true;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Lieferanten
          </Typography>
          <Typography color="text.secondary">
            Kontaktdaten, Anschriften und Ansprechpartner Ihrer Lieferanten.
          </Typography>
        </Box>
        <Button component={Link} href="/lieferanten/neu" variant="contained" startIcon={<AddRounded />}>
          Neuer Lieferant
        </Button>
      </Stack>

      {!isSqlConfigured() && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Lokaler Demo-Modus: Daten liegen nur im Arbeitsspeicher. Mit <code>SQL_SERVER</code> und{" "}
          <code>SQL_DATABASE</code> in <code>.env.local</code> wird Azure SQL verwendet.
        </Alert>
      )}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Lieferant wurde gespeichert.
        </Alert>
      )}

      <Box component="form" action="/lieferanten" sx={{ mb: 3 }}>
        <TextField
          name="q"
          defaultValue={search}
          placeholder="Suchen nach Firma, Ansprechpartner, Ort oder Kategorie …"
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
              sx: { bgcolor: "background.paper", borderRadius: 9999 },
            },
          }}
        />
      </Box>

      {loadError ? (
        <Alert severity="error">
          Die Lieferanten konnten nicht geladen werden. Die Datenbank wacht eventuell gerade auf – bitte
          die Seite in einem Moment neu laden.
        </Alert>
      ) : suppliers.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {suppliers.length} {suppliers.length === 1 ? "Lieferant" : "Lieferanten"}
            {search ? ` für „${search}“` : ""}
          </Typography>
          <Grid container spacing={2.5}>
            {suppliers.map((s) => (
              <Grid key={s.id} size={{ xs: 12, md: 6 }}>
                <SupplierCard supplier={s} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

function SupplierCard({ supplier: s }: { supplier: Supplier }) {
  const address = [s.street, [s.postal_code, s.city].filter(Boolean).join(" "), s.country !== "Deutschland" ? s.country : null]
    .filter(Boolean)
    .join(", ");
  const websiteHref = s.website ? (/^https?:\/\//i.test(s.website) ? s.website : `https://${s.website}`) : null;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: "common.white",
              background: "var(--neural-grad)",
            }}
          >
            <LocalShippingRounded />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={600} sx={{ lineHeight: 1.3 }}>
              {s.company_name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} useFlexGap flexWrap="wrap">
              {s.category && <Chip label={s.category} size="small" sx={{ height: 22, fontSize: 12 }} />}
              {s.vat_id && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                  USt-IdNr. {s.vat_id}
                </Typography>
              )}
            </Stack>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Bearbeiten">
              <IconButton
                component={Link}
                href={`/lieferanten/${s.id}/bearbeiten`}
                size="small"
                aria-label={`${s.company_name} bearbeiten`}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <DeleteSupplierButton id={s.id} name={s.company_name} />
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ mt: 2.5 }}>
          {address && <Line icon={<PlaceOutlined fontSize="small" />}>{address}</Line>}
          {(s.contact_name || s.contact_role) && (
            <Line icon={<PersonOutlineRounded fontSize="small" />}>
              {s.contact_name}
              {s.contact_role && (
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {s.contact_name ? " · " : ""}
                  {s.contact_role}
                </Box>
              )}
            </Line>
          )}
          {s.email && (
            <Line icon={<EmailOutlined fontSize="small" />}>
              <MuiLink href={`mailto:${s.email}`} underline="hover">
                {s.email}
              </MuiLink>
            </Line>
          )}
          {s.phone && (
            <Line icon={<PhoneOutlined fontSize="small" />}>
              <MuiLink href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} underline="hover">
                {s.phone}
              </MuiLink>
            </Line>
          )}
          {websiteHref && (
            <Line icon={<LanguageRounded fontSize="small" />}>
              <MuiLink href={websiteHref} target="_blank" rel="noopener noreferrer" underline="hover">
                {s.website}
              </MuiLink>
            </Line>
          )}
        </Stack>

        {s.notes && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(79,70,229,0.05)", whiteSpace: "pre-line" }}
          >
            {s.notes}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box sx={{ color: "text.secondary", display: "flex", pt: "1px" }}>{icon}</Box>
      <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {children}
      </Typography>
    </Stack>
  );
}

function EmptyState({ search }: { search?: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 5, textAlign: "center" }}>
        <Typography fontWeight={600}>
          {search ? `Keine Lieferanten für „${search}“ gefunden` : "Noch keine Lieferanten angelegt"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
          {search ? "Suchbegriff anpassen oder einen neuen Lieferanten anlegen." : "Legen Sie den ersten Lieferanten an."}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {search && (
            <Button component={Link} href="/lieferanten" variant="outlined">
              Suche zurücksetzen
            </Button>
          )}
          <Button component={Link} href="/lieferanten/neu" variant="contained" startIcon={<AddRounded />}>
            Neuer Lieferant
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
