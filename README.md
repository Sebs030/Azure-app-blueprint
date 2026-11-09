# Intool Demo – Next.js auf Azure mit Microsoft SSO

Demo-App auf Basis des *Azure Stack Spec*-Blueprints: Next.js (App Router, standalone) auf
**Azure App Service Linux**, Login per **Easy Auth (Microsoft Entra ID, Single Tenant)**.
Nach der Anmeldung sieht der Nutzer einen Startscreen mit persönlicher Begrüßung,
Schnellzugriff-Kacheln und seinen Kontodaten.

```
Browser ──► App Service (Linux, Node 22, Next.js standalone)
             └─ Easy Auth erzwingt Login → Header X-MS-CLIENT-PRINCIPAL* → src/lib/auth.ts
Monitoring: Application Insights (workspace-based, Tagesdeckel 0,1 GB)
```

**Umfang der Demo:** Web App, Auth, Monitoring, CI/CD. Azure SQL und Functions aus dem Blueprint
sind bewusst noch nicht enthalten (siehe [Nächste Schritte](#nächste-schritte)).
Kosten: im Wesentlichen der App Service Plan B1 (ca. 12–15 €/Monat), mit `F1` kostenlos.

## Stack

| Bereich | Version | Hinweis |
|---|---|---|
| Next.js | 15.5 | `@mui/material-nextjs` v6 unterstützt nur Next ≤ 15 – daher nicht Next 16 |
| MUI | 6.5 (`@mui/material`, `@mui/icons-material`, `@mui/material-nextjs`) | v6 wegen `Grid2` |
| Tailwind CSS | 4 | nur Utilities, CSS-Layer mit MUI |
| Tests | Vitest | u. a. Dev-Fallback greift nicht in Produktion |

## Projektstruktur

```
infra/main.bicep, main.bicepparam   Web App, Plan, App Insights, Log Analytics
scripts/configure-auth.sh           Easy Auth + App Registration (idempotent)
src/app/page.tsx                    Startscreen
src/app/api/me/route.ts             Beispiel-Route-Handler mit requireUser()
src/components/AppHeader.tsx        Kopfzeile mit Benutzermenü / Abmelden
src/lib/auth.ts                     Identität aus Easy-Auth-Headern
src/theme/theme.ts                  MUI-Theme (Pill-Buttons)
src/app/globals.css                 Tailwind + --neural-grad
.github/workflows/deploy-web.yml    Build + Deploy per GitHub OIDC
```

## Lokal starten

```bash
npm ci
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Lokal gibt es kein Easy Auth. `DEV_USER_NAME` in `.env.local` simuliert einen angemeldeten
Nutzer (nur bei `NODE_ENV !== production`). Ohne die Variable erscheint der Screen
„Anmeldung erforderlich".

Checks: `npm run typecheck && npm test && npm run build`

## Deployment nach Azure

### 1. Voraussetzungen

Azure CLI, Bicep (`az bicep install`), `az login`, Rechte *Owner*/*Contributor* auf der RG und
Recht zum Anlegen von App Registrations.

```bash
az account set --subscription <subscription-id>
```

```bash
az group create -n rg-intool-proto -l germanywestcentral --tags project=intool env=prototype
```

### 2. Infrastruktur (Bicep)

`infra/main.bicepparam` anpassen (`appName`, `owner`, ggf. `appServiceSku`), dann:

```bash
az deployment group what-if -g rg-intool-proto -f infra/main.bicep -p infra/main.bicepparam
```

```bash
az deployment group create -g rg-intool-proto -f infra/main.bicep -p infra/main.bicepparam --query properties.outputs
```

Den Output `webAppName` für die nächsten Schritte notieren.

### 3. Microsoft SSO (Easy Auth)

```bash
scripts/configure-auth.sh rg-intool-proto <webAppName> --assign-me
```

Das Skript legt die App Registration (Single Tenant) an, aktiviert **„Zuweisung erforderlich"**,
weist optional dich selbst zu, setzt das Client Secret als App Setting und aktiviert
„Require authentication" mit Redirect zum Microsoft-Login.

- Weitere Nutzer/Gruppen: Entra Admin Center → Enterprise applications → `<webAppName>-web` → Users and groups.
- Das **Client Secret läuft nach 1 Jahr ab** → Kalendereintrag setzen, Skript erneut ausführen.
- **Nach jedem erneuten Bicep-Deployment** das Skript erneut ausführen (Bicep überschreibt App Settings).
- Alternative ohne Skript: Portal → Web App → Authentication → Add identity provider → Microsoft,
  *Current tenant*, *Require authentication*, *HTTP 302*.
- CLI-Parameter bei Bedarf mit `az webapp auth --help` gegen die installierte Version prüfen.

### 4. GitHub OIDC + Deployment

```bash
APP_ID=$(az ad app create --display-name "gh-deploy-intool" --query appId -o tsv)
az ad sp create --id "$APP_ID"
az role assignment create --assignee "$APP_ID" --role "Website Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/rg-intool-proto"
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<org>/<repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

In GitHub unter *Settings → Secrets and variables → Actions → Variables* setzen:
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `WEB_APP_NAME`.
Danach deployt jeder Push auf `main` (oder manuell per *Run workflow*).

### 5. Verifikation

- [ ] Web-URL im Inkognito-Fenster → Microsoft-Login → Startscreen mit eigenem Namen.
- [ ] Nicht zugewiesener Nutzer wird von Entra abgewiesen.
- [ ] „Abmelden" im Benutzermenü führt über `/.auth/logout` zurück zum Login.
- [ ] Requests erscheinen in Application Insights.

## Design

- Gradient zentral als `--neural-grad` in `src/app/globals.css` – aktuell ein **Platzhalter**
  (Indigo → Violett → Cyan). Finalen Wert dort eintragen, alle Flächen übernehmen ihn.
- Konventionen (Grid2, Pill-Buttons, keine hardcodierten Gradient-Farben): siehe `CLAUDE.md`.

## Nächste Schritte

Gemäß Blueprint, noch nicht umgesetzt: Azure SQL (Serverless Free Offer, Managed Identity, Kysely),
Azure Functions (Flex Consumption), Budget-Alarm, eigene Domain.
