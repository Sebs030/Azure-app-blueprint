# Konventionen

Projekt: interne Next.js-Demo auf Azure App Service mit Easy Auth (Microsoft SSO).
Architektur und Vorgaben: siehe README.md.

## UI
- MUI ist das Haupt-System für Komponenten und Layout. MUI bleibt auf **v6**.
- `Grid2` (`import Grid from "@mui/material/Grid2"`) statt altem `Grid`, überall. Breiten via `size={{ xs: 12, md: 6 }}`.
- Buttons sind Pills (`borderRadius: 9999`). Das ist zentral im Theme gesetzt (`MuiButton.styleOverrides.root`), nicht pro Button.
- Neural Gradient: immer `background: "var(--neural-grad)"`. Die Variable steht in `src/app/globals.css` unter `:root`. **Nie** Gradient-Farbwerte in Komponenten hardcoden.
- Tailwind (v4) nur für kleine Utilities (Abstände, Flex-Helfer). Keine Tailwind-Komponentenbibliothek daneben bauen.
- CSS-Layer-Reihenfolge `theme, base, mui, components, utilities` nicht ändern (MUI + Tailwind koexistieren).

## Auth & Sicherheit
- Jede Server Action und jeder Route Handler beginnt mit `await requireUser()` (`src/lib/auth.ts`).
- Identität kommt ausschließlich aus den Easy-Auth-Headern. Der Dev-Fallback (`DEV_USER_*`) darf in Produktion nie greifen – Test in `src/lib/auth.test.ts` nicht entfernen.
- Kein Secret im Code oder Repo. Konfiguration über App Settings. Datenbankzugriff (später) nur über Managed Identity.

## Infra
- Infrastruktur nur über `infra/main.bicep`. Vor jedem Deployment `az deployment group what-if`.
- Ein Bicep-Deployment überschreibt alle App Settings → danach `scripts/configure-auth.sh` erneut ausführen.
- `configure-auth.sh` auf Windows immer via `bash` aufrufen (CRLF-Problem). Bei CLI-Versionsfehlern (`auth v1/v2`) direkt `az rest PUT authsettingsV2` nutzen – Beispiel im README.
- Nach dem **ersten** Deployment mit `WEBSITE_RUN_FROM_PACKAGE=1` ggf. manuellen App-Restart nötig (Azure Portal oder `az webapp restart`).
- GitHub OIDC: Audience muss `api://AzureADTokenExchange` sein (nicht `api://AzureADMyOrg`). GitHub kodiert seit 2024 numerische IDs in den Subject-Claim (`repo:OWNER@USERID/REPO@REPOID:ref:...`) → Federated Credential muss exakt diesen Subject matchen. Subject im Fehlerlog ablesen.
- Keine Ressourcen mit Fixkosten (Private Endpoints, Front Door, Redis …) ohne Rückfrage.

## Checks
- `npm run typecheck && npm test && npm run build`
