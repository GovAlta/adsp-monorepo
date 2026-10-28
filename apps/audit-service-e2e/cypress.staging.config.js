const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'UAT',
    TAGS: '',
    keycloakTokenUrlSuffix: '/protocol/openid-connect/token',
    'client-id': 'auto-test-client',
    clientSecret: '',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: '2ef492af-0a16-470b-9ea5-c8bfa7b08a7c',
    tenantName: 'autotest',
    'autotest-admin-token': '',
    accessManagementApi: '',
    tenantWebAppUrl: 'https://adsp-uat.alberta.ca/',
  },
  retries: 1,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/audit-service-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/audit-service-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/audit-service-e2e/results/results-[hash].xml',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://audit-service.adsp-uat.apps.aro-01.int.gov.ab.ca',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
