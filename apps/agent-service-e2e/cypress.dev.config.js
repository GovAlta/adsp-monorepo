const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'DEV',
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
  retries: 0,
  defaultCommandTimeout: 10000,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/agent-service-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/agent-service-e2e/screenshots',
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://agent-service-adsp-dev.apps.aro-01.int.gov.ab.ca',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
