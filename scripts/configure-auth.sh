#!/usr/bin/env bash
# Richtet Easy Auth (Microsoft Entra ID, Single Tenant) für die Web App ein.
# Idempotent: kann nach jedem Infra-Deployment erneut ausgeführt werden
# (Bicep überschreibt App Settings und damit das Client Secret).
#
# Nutzung:
#   scripts/configure-auth.sh <resource-group> <web-app-name> [--assign-me]
#
#   --assign-me   weist den angemeldeten az-Nutzer der Enterprise App zu
#                 (nötig, weil "Zuweisung erforderlich" aktiviert wird).
#
# Voraussetzungen: az login, Recht zum Anlegen von App Registrations
# (z. B. Rolle "Application Developer"). Parameter vorher mit
# "az webapp auth --help" gegen die installierte CLI-Version abgleichen.
set -euo pipefail

RG="${1:?Resource Group fehlt}"
APP="${2:?Web-App-Name fehlt}"
ASSIGN_ME="${3:-}"

TENANT=$(az account show --query tenantId -o tsv)
HOST=$(az webapp show -g "$RG" -n "$APP" --query defaultHostName -o tsv)
DISPLAY_NAME="$APP-web"
REDIRECT="https://$HOST/.auth/login/aad/callback"

echo "» App Registration '$DISPLAY_NAME' suchen/anlegen"
OBJ_ID=$(az ad app list --display-name "$DISPLAY_NAME" --query "[0].id" -o tsv)
if [[ -z "$OBJ_ID" ]]; then
  OBJ_ID=$(az ad app create --display-name "$DISPLAY_NAME" \
    --sign-in-audience AzureADMyOrg \
    --query id -o tsv)
  sleep 10  # Entra-Replikation abwarten
fi
CLIENT_ID=$(az ad app show --id "$OBJ_ID" --query appId -o tsv)

# Direkter Graph-PATCH statt az ad app update (robuster bei frisch angelegten Apps)
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJ_ID" \
  --body "{\"web\":{\"redirectUris\":[\"$REDIRECT\"],\"implicitGrantSettings\":{\"enableIdTokenIssuance\":true}}}"

# Delegierte Berechtigung Microsoft Graph User.Read (für den Login ausreichend)
az ad app permission add --id "$CLIENT_ID" \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope >/dev/null 2>&1 || true

echo "» Service Principal sicherstellen + 'Zuweisung erforderlich' aktivieren"
SP_ID=$(az ad sp list --filter "appId eq '$CLIENT_ID'" --query "[0].id" -o tsv)
if [[ -z "$SP_ID" ]]; then
  SP_ID=$(az ad sp create --id "$CLIENT_ID" --query id -o tsv)
fi
az ad sp update --id "$SP_ID" --set appRoleAssignmentRequired=true

if [[ "$ASSIGN_ME" == "--assign-me" ]]; then
  ME=$(az ad signed-in-user show --query id -o tsv)
  echo "» Angemeldeten Nutzer zuweisen ($ME)"
  az rest --method POST \
    --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignedTo" \
    --body "{\"principalId\":\"$ME\",\"resourceId\":\"$SP_ID\",\"appRoleId\":\"00000000-0000-0000-0000-000000000000\"}" \
    >/dev/null 2>&1 || echo "  (bereits zugewiesen)"
fi

echo "» Client Secret erneuern (Laufzeit 1 Jahr – Ablauf im Kalender notieren!)"
SECRET=$(az ad app credential reset --id "$CLIENT_ID" --display-name easyauth --years 1 --query password -o tsv)

az webapp config appsettings set -g "$RG" -n "$APP" \
  --settings MICROSOFT_PROVIDER_AUTHENTICATION_SECRET="$SECRET" >/dev/null

echo "» Easy Auth konfigurieren"
az webapp auth microsoft update -g "$RG" -n "$APP" \
  --client-id "$CLIENT_ID" \
  --client-secret-setting-name MICROSOFT_PROVIDER_AUTHENTICATION_SECRET \
  --issuer "https://login.microsoftonline.com/$TENANT/v2.0" \
  --allowed-audiences "api://$CLIENT_ID" "$CLIENT_ID" \
  --yes >/dev/null

az webapp auth update -g "$RG" -n "$APP" \
  --enabled true \
  --action RedirectToLoginPage \
  --redirect-provider azureactivedirectory \
  --require-https true >/dev/null

echo "✓ Fertig. Login testen (Inkognito): https://$HOST"
echo "  Weitere Nutzer/Gruppen: Entra Admin Center → Enterprise applications → $DISPLAY_NAME → Users and groups"
