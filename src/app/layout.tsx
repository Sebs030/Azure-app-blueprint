import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import { theme } from "@/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intool Demo",
  description: "Interne Demo-App auf Basis des Azure-Blueprints",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
