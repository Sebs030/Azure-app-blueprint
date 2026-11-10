import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import LockRounded from "@mui/icons-material/LockRounded";

export function SignedOut() {
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
