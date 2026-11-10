"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Button,
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import { initials } from "@/lib/format";

type Props = { name: string; email?: string; logoutUrl: string };

const nav = [
  { href: "/", label: "Start" },
  { href: "/lieferanten", label: "Lieferanten" },
];

export function AppHeader({ name, email, logoutUrl }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.72)",
        backdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid rgba(17,24,39,0.06)",
      }}
    >
      <Toolbar sx={{ gap: 1.5, maxWidth: 1200, width: "100%", mx: "auto" }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            color: "common.white",
            background: "var(--neural-grad)",
          }}
        >
          <AutoAwesomeRounded fontSize="small" />
        </Box>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ fontSize: 17, color: "inherit", textDecoration: "none", mr: { xs: 0.5, sm: 2 } }}
        >
          Intool
        </Typography>
        <Box component="nav" aria-label="Hauptnavigation" sx={{ display: "flex", gap: 0.5 }}>
          {nav.map((n) => (
            <Button
              key={n.href}
              component={Link}
              href={n.href}
              size="small"
              aria-current={isActive(n.href) ? "page" : undefined}
              sx={{
                color: isActive(n.href) ? "primary.main" : "text.secondary",
                bgcolor: isActive(n.href) ? "rgba(79,70,229,0.08)" : "transparent",
                px: 1.75,
              }}
            >
              {n.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ flex: 1 }} />
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Benutzermenü öffnen"
          aria-controls={anchor ? "user-menu" : undefined}
          aria-haspopup="true"
          size="small"
        >
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, background: "var(--neural-grad)" }}>
            {initials(name)}
          </Avatar>
        </IconButton>
        <Menu
          id="user-menu"
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 240, borderRadius: 3 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={600}>{name}</Typography>
            {email && (
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            )}
          </Box>
          <Divider />
          <MenuItem component="a" href={logoutUrl}>
            <ListItemIcon>
              <LogoutRounded fontSize="small" />
            </ListItemIcon>
            Abmelden
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
