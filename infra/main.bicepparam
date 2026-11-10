using './main.bicep'

param appName = 'azdemo'
param appServiceSku = 'B1'
param owner = 'sebastian@5thindustry.de'

// SQL-Entra-Admin (siehe README, Abschnitt Azure SQL)
param sqlAdminLogin = 'TODO-admin-upn-oder-gruppe'
param sqlAdminObjectId = 'TODO-object-id'
param sqlAdminPrincipalType = 'User'
param useSqlFreeOffer = true
param devIp = ''
