// Demo-Infrastruktur: Web App (Next.js standalone), Azure SQL (Serverless, Free Offer)
// und Monitoring. Functions aus dem Blueprint folgen später (siehe README).
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

@description('Entra-Admin des SQL Servers: UPN des Nutzers oder Name der Gruppe.')
param sqlAdminLogin string

@description('Object-ID des Entra-Admins (az ad signed-in-user show --query id -o tsv).')
param sqlAdminObjectId string

@description('Typ des Entra-Admins. Eine Gruppe ist für Teams empfohlen.')
@allowed(['User', 'Group'])
param sqlAdminPrincipalType string = 'User'

@description('Azure SQL Free Offer nutzen. Gilt nur EINMAL pro Subscription – vorher prüfen!')
param useSqlFreeOffer bool = true

@description('Optional: eigene öffentliche IP für lokalen DB-Zugriff (Migrationen). Leer = keine Regel.')
param devIp string = ''

var suffix = uniqueString(resourceGroup().id)
var tags = {
  project: appName
  env: 'prototype'
  owner: owner
}
var webAppName = '${appName}-web-${suffix}'
var sqlDatabaseName = '${appName}-db'
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

// ---------- Azure SQL (Entra-only, Serverless, Free Offer) ----------

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: '${appName}-sql-${suffix}'
  location: location
  tags: tags
  properties: {
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: sqlAdminPrincipalType
      login: sqlAdminLogin
      sid: sqlAdminObjectId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true // keine SQL-Logins
    }
  }
}

// Bewusster Kompromiss ohne Zusatzkosten: Zugriff aus Azure-Diensten erlauben (kein Private Endpoint).
resource sqlAllowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlAllowDev 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = if (!empty(devIp)) {
  parent: sqlServer
  name: 'dev-ip'
  properties: {
    startIpAddress: devIp
    endIpAddress: devIp
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368 // 32 GB (Free-Offer-Limit)
    autoPauseDelay: 60
    minCapacity: json('0.5')
    zoneRedundant: false
    requestedBackupStorageRedundancy: 'Local'
    useFreeLimit: useSqlFreeOffer
    // Kontingent aufgebraucht → DB pausiert bis Monatsende statt Kosten zu erzeugen
    freeLimitExhaustionBehavior: useSqlFreeOffer ? 'AutoPause' : null
  }
}

// ---------- Web ----------

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
        { name: 'SQL_SERVER', value: sqlServer.properties.fullyQualifiedDomainName }
        { name: 'SQL_DATABASE', value: sqlDb.name }
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
output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDb.name
