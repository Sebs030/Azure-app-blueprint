// Demo-Infrastruktur: Web App (Next.js standalone) + Monitoring.
// SQL und Functions aus dem Blueprint sind für die Demo bewusst noch nicht enthalten
// (siehe README, "Nächste Schritte").
targetScope = 'resourceGroup'

@description('Kurzes Präfix für alle Ressourcennamen, z. B. "intool".')
@minLength(2)
@maxLength(12)
param appName string

@description('Region. Standard: Region der Resource Group.')
param location string = resourceGroup().location

@description('App Service Plan SKU. B1 empfohlen, F1 nur für Experimente (kein Always On).')
@allowed(['F1', 'B1', 'B2', 'B3'])
param appServiceSku string = 'B1'

@description('Node-Runtime für App Service Linux, vorher mit "az webapp list-runtimes --os linux" prüfen.')
param nodeVersion string = 'NODE|22-lts'

@description('Verantwortliche Person für das Tag "owner".')
param owner string

var suffix = uniqueString(resourceGroup().id)
var tags = {
  project: appName
  env: 'prototype'
  owner: owner
}
var webAppName = '${appName}-web-${suffix}'
var isFree = appServiceSku == 'F1'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-ai-${suffix}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
    IngestionMode: 'LogAnalytics'
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: { name: appServiceSku }
  properties: { reserved: true }
}

resource web 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: nodeVersion
      appCommandLine: 'node server.js'
      alwaysOn: !isFree
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      // ACHTUNG: Ein erneutes Deployment überschreibt ALLE App Settings, inkl.
      // MICROSOFT_PROVIDER_AUTHENTICATION_SECRET aus dem Easy-Auth-Setup.
      // Danach scripts/configure-auth.sh erneut ausführen.
      appSettings: [
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'PORT', value: '8080' }
        { name: 'WEBSITES_PORT', value: '8080' }
        { name: 'HOSTNAME', value: '0.0.0.0' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
}

// Basic Auth für SCM/FTP deaktivieren (Deployment läuft über GitHub OIDC)
resource scmBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'scm'
  properties: { allow: false }
}

resource ftpBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'ftp'
  properties: { allow: false }
}

output webAppName string = web.name
output webUrl string = 'https://${web.properties.defaultHostName}'
output webPrincipalId string = web.identity.principalId
output appInsightsName string = appInsights.name
