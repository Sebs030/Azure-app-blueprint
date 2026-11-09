# Azure App Blueprint – Next.js auf Azure mit Microsoft SSO

Blueprint-Demo: Next.js (App Router, standalone) auf **Azure App Service Linux**,
Login per **Easy Auth (Microsoft Entra ID, Single Tenant)**.
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
scripts/configure-auth.sh <resource-group> <webAppName> --assign-me
```

Das Skript legt die App Registration (Single Tenant) an, aktiviert **„Zuweisung erforderlich"**,
weist optional dich selbst zu, setzt das Client Secret als App Setting und aktiviert
„Require authentication" mit Redirect zum Microsoft-Login. Es ist idempotent.

- Weitere Nutzer/Gruppen: Entra Admin Center → Enterprise applications → `<webAppName>-web` → Users and groups.
- Das **Client Secret läuft nach 1 Jahr ab** → Kalendereintrag setzen, Skript erneut ausführen.
- **Nach jedem erneuten Bicep-Deployment** das Skript erneut ausführen (Bicep überschreibt App Settings).
- Das Skript entfernt das CRLF-Problem selbst (`sed -i 's/\r//'` ist bereits enthalten). Falls
  `set: pipefail: invalid option` erscheint, wurde die Datei erneut mit Windows-Zeilenenden
  gespeichert → `sed -i 's/\r//' scripts/configure-auth.sh` ausführen.

**Fallback wenn `az webapp auth` fehlschlägt** (z. B. „Cannot use auth v2 commands when app is
using auth v1" oder CLI-Versionsprobleme): Easy Auth direkt per ARM REST API setzen:

```bash
SUBSCRIPTION="<sub-id>"
RG="<resource-group>"
APP="<webAppName>"
CLIENT_ID="<appRegistrationClientId>"
TENANT="<tenantId>"
SECRET_SETTING="MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"

BODY=$(cat <<EOF
{
  "properties": {
    "platform": { "enabled": true, "runtimeVersion": "~1" },
    "globalValidation": { "requireAuthentication": true, "unauthenticatedClientAction": "RedirectToLoginPage", "redirectToProvider": "azureActiveDirectory" },
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "registration": {
          "clientId": "$CLIENT_ID",
          "clientSecretSettingName": "$SECRET_SETTING",
          "openIdIssuer": "https://login.microsoftonline.com/$TENANT/v2.0"
        },
        "validation": { "allowedAudiences": ["api://$CLIENT_ID"] }
      }
    },
    "login": { "tokenStore": { "enabled": true } },
    "httpSettings": { "requireHttps": true }
  }
}
EOF
)

az rest --method PUT \
  --uri "https://management.azure.com/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.Web/sites/$APP/config/authsettingsV2?api-version=2022-03-01" \
  --body "$BODY"
```

### 4. GitHub OIDC + Deployment

```bash
APP_ID=$(az ad app create --display-name "gh-deploy-<appName>" --query appId -o tsv)
az ad sp create --id "$APP_ID"
az role assignment create --assignee "$APP_ID" --role "Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/<resource-group>"
```

Federated Credential anlegen — **Audience muss exakt `api://AzureADTokenExchange` sein**, sonst `AADSTS700212`:

```bash
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<org>/<repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

> **Wichtig – numerisches Subject-Format:** GitHub kodiert Subject mittlerweile mit numerischen IDs
> (`repo:OWNER@USERID/REPO@REPOID:ref:refs/heads/BRANCH`). Das genaue Format steht im Fehler
> `AADSTS700213` in den GitHub Actions-Logs. Federated Credential mit diesem exakten String anlegen:
>
> ```
> repo:Sebs030@29453191/Azure-app-blueprint@1451073440:ref:refs/heads/main
> ```
>
> Nötigenfalls zwei Credentials anlegen – einen für `main` und einen für den Feature-Branch.

In GitHub unter *Settings → Secrets and variables → Actions → Variables* setzen:
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `WEB_APP_NAME`.
Danach deployt jeder Push auf `main` (oder manuell per *Run workflow*).

> **Erster Deploy:** Nach dem allerersten `WEBSITE_RUN_FROM_PACKAGE=1`-Deploy kann die App kurz 503
> zurückgeben. App Service braucht einen Neustart, um das Package-Mount zu aktivieren. Einfach
> 1–2 Minuten warten oder im Portal *Restart* drücken.

### 5. Verifikation

- [ ] Web-URL im Inkognito-Fenster → Microsoft-Login → Startscreen mit eigenem Namen.
- [ ] Nicht zugewiesener Nutzer wird von Entra abgewiesen.
- [ ] „Abmelden" im Benutzermenü führt über `/.auth/logout` zurück zum Login.
- [ ] Requests erscheinen in Application Insights.

## Design

- Gradient zentral als `--neural-grad` in `src/app/globals.css` – aktuell ein **Platzhalter**
  (Indigo → Violett → Cyan). Finalen Wert dort eintragen, alle Flächen übernehmen ihn.
- Konventionen (Grid2, Pill-Buttons, keine hardcodierten Gradient-Farben): siehe `CLAUDE.md`.

## Troubleshooting

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| `set: pipefail: invalid option` beim Ausführen von `configure-auth.sh` | Datei hat Windows-Zeilenenden (CRLF) | `sed -i 's/\r//' scripts/configure-auth.sh` |
| `Invalid value specified for property 'web'` beim `az ad app create` | `--web-redirect-uris` und ähnliche Flags funktionieren bei frisch angelegten Apps nicht | App erst anlegen, dann per `az rest PATCH` aktualisieren (so macht es das Skript) |
| `AADSTS700212: No matching federated identity record found` | Federated Credential mit falscher Audience (`api://AzureADMyOrg` statt `api://AzureADTokenExchange`) | Credential löschen und mit Audience `api://AzureADTokenExchange` neu anlegen |
| `AADSTS700213: The subject of the token doesn't match` | GitHub kodiert Subject mit numerischen IDs | Exakten Subject-String aus dem Fehlerlog auslesen und Credential mit diesem String anlegen |
| App zeigt 503 direkt nach erstem Deployment | App Service muss nach erstem `WEBSITE_RUN_FROM_PACKAGE=1`-Mount neu starten | 1–2 Minuten warten oder im Portal *Restart* klicken |
| `Cannot use auth v2 commands when app is using auth v1` | Alte Auth-Konfiguration von einem vorherigen Portal-Klick | Easy Auth direkt per `az rest PUT authsettingsV2` setzen (Fallback in Abschnitt 3) |
| `az ad app show` schlägt fehl obwohl App in `az ad app list` erscheint | Stale/inkonsistente Entra-Replikation | App per Object-ID löschen: `az ad app delete --id <OBJ_ID>` und Skript erneut laufen lassen |
| `clientId=` leer in `az rest --body` unter PowerShell | PowerShell interpoliert `$CLIENT_ID` in `--body` falsch oder JSON-Datei nicht korrekt übergeben | JSON-Body als Datei schreiben und `--body "@$env:TEMP\body.json"` verwenden |

## Nächste Schritte

Gemäß Blueprint, noch nicht umgesetzt: Azure SQL (Serverless Free Offer, Managed Identity, Kysely),
Azure Functions (Flex Consumption), Budget-Alarm, eigene Domain.
