import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import VerifiedUserRounded from "@mui/icons-material/VerifiedUserRounded";
import CloudDoneRounded from "@mui/icons-material/CloudDoneRounded";
import { AppHeader } from "@/components/AppHeader";
import { getUser, LOGOUT_URL } from "@/lib/auth";
import { firstName, greeting, longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const tiles = [
  {
    title: "Dashboard",
    text: "Kennzahlen und aktuelle Vorgänge auf einen Blick.",
    icon: <DashboardRounded />,
  },
  {
    title: "Dokumente",
    text: "Vorlagen, Richtlinien und geteilte Dateien.",
    icon: <DescriptionRounded />,
  },
  {
    title: "Team",
    text: "Ansprechpartner, Zuständigkeiten und Kontakte.",
    icon: <GroupsRounded />,
  },
  {
    title: "Auswertungen",
    text: "Berichte und Analysen für Ihre Projekte.",
    icon: <InsightsRounded />,
  },
];

export default async function HomePage() {
  const user = await getUser();
  if (!user) return <SignedOut />;

  const now = new Date();
  const first = firstName(user.name);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppHeader name={user.name} email={user.email} logoutUrl={LOGOUT_URL} />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Hero */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 7,
            p: { xs: 3, sm: 5, md: 6 },
            color: "common.white",
            background: "var(--neural-grad)",
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.18,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(120deg, transparent 30%, black 100%)",
            }}
          />
          <Stack spacing={2} sx={{ position: "relative", maxWidth: 640 }}>
            <Chip
              icon={<VerifiedUserRounded sx={{ "&&": { color: "inherit" } }} />}
              label="Angemeldet über Microsoft"
              size="small"
              sx={{
                alignSelf: "flex-start",
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(6px)",
              }}
            />
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, sm: 40, md: 46 } }}>
              {greeting(now)}
              {first ? `, ${first}` : ""}!
            </Typography>
            <Typography sx={{ opacity: 0.85, fontSize: { xs: 16, md: 18 } }}>
              Willkommen in Ihrem internen Arbeitsbereich. Heute ist {longDate(now)}.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }} useFlexGap flexWrap="wrap">
              <Button
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                sx={{ bgcolor: "common.white", color: "grey.900", "&:hover": { bgcolor: "grey.100" } }}
              >
                Loslegen
              </Button>
              <Button
                variant="outlined"
                href={LOGOUT_URL}
                sx={{
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.5)",
                  "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Abmelden
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Schnellzugriff */}
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mt: 5, mb: 2 }}>
          <Typography variant="h6" component="h2">
            Schnellzugriff
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Module folgen in Kürze
          </Typography>
        </Stack>
        <Grid container spacing={2.5}>
          {tiles.map((t) => (
            <Grid key={t.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 32px -12px rgba(79,70,229,0.35)",
                    borderColor: "rgba(79,70,229,0.35)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      color: "common.white",
                      background: "var(--neural-grad)",
                      mb: 2,
                    }}
                  >
                    {t.icon}
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography fontWeight={600}>{t.title}</Typography>
                    <Chip label="Bald" size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {t.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Konto + Status */}
        <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Ihr Konto
                </Typography>
                <Stack spacing={1.5}>
                  <InfoRow label="Name" value={user.name} />
                  <InfoRow label="E-Mail" value={user.email ?? "–"} />
                  <InfoRow label="Objekt-ID" value={user.id || "–"} mono />
                  <InfoRow label="Rollen" value={user.roles.length ? user.roles.join(", ") : "Standardnutzer"} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Sicherheit & Betrieb
                </Typography>
                <Stack spacing={2}>
                  <StatusRow icon={<LockRounded fontSize="small" />} title="Single Sign-on" text="Microsoft Entra ID, Single Tenant" />
                  <StatusRow icon={<VerifiedUserRounded fontSize="small" />} title="Zugriff" text="Nur zugewiesene Nutzer" />
                  <StatusRow icon={<CloudDoneRounded fontSize="small" />} title="Hosting" text="Azure App Service, Frankfurt" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: "center", mt: 6 }}>
          Interne Anwendung · Prototyp
        </Typography>
      </Container>
    </Box>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0, sm: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 110 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, wordBreak: "break-all", fontFamily: mono ? "ui-monospace, monospace" : undefined }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function StatusRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(16,185,129,0.12)",
          color: "success.dark",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      </Box>
      <Chip label="Aktiv" size="small" color="success" variant="outlined" />
    </Stack>
  );
}

function SignedOut() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: 3,
        background: "var(--neural-grad)",
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 6 }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              mx: "auto",
              mb: 2,
              borderRadius: 3.5,
              display: "grid",
              placeItems: "center",
              color: "common.white",
              background: "var(--neural-grad)",
            }}
          >
            <LockRounded />
          </Box>
          <Typography variant="h6" component="h1">
            Anmeldung erforderlich
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Bitte melden Sie sich mit Ihrem Microsoft-Konto an. Lokal: <code>DEV_USER_NAME</code> in{" "}
            <code>.env.local</code> setzen.
          </Typography>
          <Button variant="contained" href="/.auth/login/aad?post_login_redirect_uri=/" fullWidth size="large">
            Mit Microsoft anmelden
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
