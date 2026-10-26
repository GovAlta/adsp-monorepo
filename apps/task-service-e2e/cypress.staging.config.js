const { defineConfig } = require('cypress');
const { preprocessor } = require('./src/plugins');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://task-service.adsp-uat.alberta.ca',
    specPattern: 'src/integration/**/*.feature',
    supportFile: 'src/support/index.ts',
    setupNodeEvents(on, config) {
      return preprocessor(on, config);
    },
  },
  env: {
    'env-name': 'UAT',
    email: 'auto.test@gov.ab.ca',
    password: '',
    clientId: 'auto-test-client',
    clientSecret: '',
    realm: '2ef492af-0a16-470b-9ea5-c8bfa7b08a7c',
    tenantName: 'autotest',
    tenantWebAppUrl: 'https://adsp-uat.alberta.ca/',
    accessManagementApi: '',
    keycloakTokenUrlSuffix: '/protocol/openid-connect/token',
    TAGS: '',
  },
});
