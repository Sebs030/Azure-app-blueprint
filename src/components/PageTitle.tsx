import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

export function PageTitle({ title, subtitle, backHref }: { title: string; subtitle?: string; backHref: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Button component={Link} href={backHref} size="small" startIcon={<ArrowBackRounded />} sx={{ ml: -1, mb: 1 }}>
        Zurück zur Übersicht
      </Button>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </Typography>
      {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
    </Box>
  );
}
