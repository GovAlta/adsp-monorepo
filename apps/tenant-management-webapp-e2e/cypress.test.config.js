const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'TEST',
    TAGS: '',
    keycloakTokenUrlSuffix: '/protocol/openid-connect/token',
    'core-api-client-id': 'tenant-api',
    coreApiClientSecret: '',
    'core-api-user': 'dio-qa-dev@gov.ab.ca',
    coreApiUserPassword: '',
    'core-api-token': '',
    'client-id': 'auto-test-client',
    clientSecret: '',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: 'autotest',
    tenantName: 'autotest',
    realmOwner: 'dio-qa-dev@gov.ab.ca',
    'autotest-admin-token': '',
    email2: 'auto.test2@gov.ab.ca',
    password2: '',
    email3: 'auto.test3@gov.ab.ca',
    password3: '',
    eventServiceApiUrl: '',
    notificationServiceUrl: '',
    keycloakUrl: '',
    tenantManagementApi: '',
    accessManagementApi: '',
    uiComponentUrl: '',
    fileApi: '',
    formApi: '',
    formAppUrl: '',
  },
  numTestsKeptInMemory: 0,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/tenant-management-webapp-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/tenant-management-webapp-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/tenant-management-webapp-e2e/results/results-[hash].xml',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://tenant-management-webapp-core-services-test.os99.gov.ab.ca',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});