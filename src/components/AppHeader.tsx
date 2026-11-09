"use client";

import { useState } from "react";
import {
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

export function AppHeader({ name, email, logoutUrl }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

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
        <Typography variant="h6" component="span" sx={{ fontSize: 17 }}>
          Intool
        </Typography>
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
