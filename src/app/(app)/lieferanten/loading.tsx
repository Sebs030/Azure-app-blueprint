import { Card, CardContent, Container, Skeleton, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";

// Wird u. a. angezeigt, während eine pausierte Serverless-DB aufwacht.
export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Skeleton variant="text" width={220} height={48} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Lieferanten werden geladen … (nach längerer Pause kann die Datenbank bis zu einer Minute brauchen)
      </Typography>
      <Grid container spacing={2.5}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2}>
                  <Skeleton variant="rounded" width={44} height={44} />
                  <Stack sx={{ flex: 1 }}>
                    <Skeleton width="60%" />
                    <Skeleton width="30%" />
                  </Stack>
                </Stack>
                <Skeleton sx={{ mt: 2 }} />
                <Skeleton width="80%" />
                <Skeleton width="50%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
