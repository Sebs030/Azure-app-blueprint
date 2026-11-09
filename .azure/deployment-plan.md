# Azure Deployment Plan

**Status**: Validated

**Last Updated**: 2026-11-09

---

## 1. Mode

MODIFY — Existing Next.js 15 (standalone) app with existing Bicep infrastructure. First deployment to Azure.

---

## 2. Requirements

| Item | Value |
|------|-------|
| Subscription | `88e20e68-340d-4345-8aa2-20f04cd5014b` |
| Resource Group | `azure-app-blueprint` (needs to be created in `westeurope`) |
| Location | `westeurope` |
| `appName` Prefix | `azdemo` |
| Owner Tag | `sebastian@5thindustry.de` |
| App Service SKU | B1 |
| Node Version | NODE\|22-lts |

---

## 3. Codebase Scan

| Component | Detail |
|-----------|--------|
| Framework | Next.js 15, `output: "standalone"`, Node ≥22 |
| UI | MUI v6 + Tailwind v4 |
| Auth | Easy Auth (MS SSO) via `src/lib/auth.ts` |
| IaC | `infra/main.bicep` — Log Analytics, App Insights, App Service Plan (Linux), Web App |
| CI/CD | `.github/workflows/deploy-web.yml` — GitHub OIDC → `azure/login@v2` → `azure/webapps-deploy@v3` |
| Params file | `infra/main.bicepparam` — currently has stale values (`intool`, `TODO-owner`) |

---

## 4. Recipe

**Type**: AZCLI / Bicep (not azd)

Deployment via `az deployment group create` — aligns with CLAUDE.md convention and existing workflow.

---

## 5. Architecture

```
GitHub Actions (OIDC)
  └── azure/login@v2
  └── azure/webapps-deploy@v3
        └── azdemo-web-{uniqueString}  (App Service Linux, B1, westeurope)
              ├── App Insights → Log Analytics Workspace
              ├── Easy Auth (Microsoft SSO) — post-deploy via configure-auth.sh
              └── PORT 8080, NODE|22-lts, standalone server.js
```

---

## 6. Deployment Steps

### A — Pre-flight (manual, one-time)

1. **Update `infra/main.bicepparam`** — set `appName = 'azdemo'`, `owner = 'sebastian@5thindustry.de'`
2. **Create Resource Group**
   ```bash
   az group create --name azure-app-blueprint --location westeurope \
     --subscription 88e20e68-340d-4345-8aa2-20f04cd5014b
   ```
3. **What-if check** (required by CLAUDE.md)
   ```bash
   az deployment group what-if \
     --subscription 88e20e68-340d-4345-8aa2-20f04cd5014b \
     --resource-group azure-app-blueprint \
     --template-file infra/main.bicep \
     --parameters infra/main.bicepparam
   ```
4. **Deploy infrastructure**
   ```bash
   az deployment group create \
     --subscription 88e20e68-340d-4345-8aa2-20f04cd5014b \
     --resource-group azure-app-blueprint \
     --template-file infra/main.bicep \
     --parameters infra/main.bicepparam
   ```
5. **Note output** `webAppName` — needed for GitHub Actions var `WEB_APP_NAME`

### B — GitHub Actions Setup (one-time)

6. Create App Registration + Federated Credential (OIDC) for the repo
7. Set repository variables:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID` = `88e20e68-340d-4345-8aa2-20f04cd5014b`
   - `WEB_APP_NAME` = output from step 5
8. Grant the service principal `Contributor` on the resource group

### C — App Deployment

9. Push to `main` → GitHub Actions builds + deploys standalone package

### D — Post-deploy

10. Run `scripts/configure-auth.sh` to set up Easy Auth (Microsoft SSO)

---

## 7. Validation Proof

### Validation Steps (Bicep recipe)
- [x] 1. Core Validation (CLI authenticated, bicep build, deployment validate, what-if) — `validate-deployment.ps1`
- [ ] 2. Azure Policy Validation (skipped — no custom policies on this subscription)

### Results — 2026-11-09

```
=== Azure deployment validation ===
Template:   ./infra/main.bicep
Scope:      resource group 'azure-app-blueprint'

Step 1: Azure CLI installed         PASS
Step 2: Authenticated (Pay-As-You-Go) PASS
Step 3: Bicep compilation           PASS
Step 4: Template validation         PASS
Step 5: What-if preview             PASS  Create: 7, Modify: 0, Delete: 0

OVERALL: PASS
```

Subscription: `88e20e68-340d-4345-8aa2-20f04cd5014b` | Tenant: `96c56def-a194-43b4-87de-1be80c41481b`

### Build Verification — 2026-11-09
```
npm run typecheck  → PASS (0 errors)
npm test           → PASS (2 test files, 6 tests)
npm run build      → PASS (Next.js standalone build, 7 routes)
```

### Role Assignment Verification — 2026-11-09
- Status: Verified — no issues
- Identities: Web App SystemAssigned Managed Identity
- Role assignments in Bicep: none required (no KV/Storage/SQL/Cosmos in scope)
- App Insights access: connection string via App Settings (no RBAC needed)
- `webPrincipalId` output available for future role grants

---

## 9. Deployed Resources

| Output | Value |
|--------|-------|
| Web App Name | `azdemo-web-fsynbmtm4xdfg` |
| Web URL | `https://azdemo-web-fsynbmtm4xdfg.azurewebsites.net` |
| Managed Identity Principal ID | `96d6c852-fde7-4c7f-8fc9-92ca4de7e457` |
| GitHub OIDC App | `eb098826-1159-4eb0-be09-9e9676cfb8d5` |
| Deployed | 2026-11-09 |

**Status: Infra deployed. GitHub Actions vars pending. Easy Auth pending.**

---

## 8. Notes

- Each Bicep re-deployment overwrites all App Settings → re-run `configure-auth.sh` afterwards
- `isFree = false` for B1 → `alwaysOn: true` ✓
- SCM + FTP basic auth disabled in Bicep ✓
- GitHub Actions uses `cancel-in-progress: false` → no concurrent deploys ✓
