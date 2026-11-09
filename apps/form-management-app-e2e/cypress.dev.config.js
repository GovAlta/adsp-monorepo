const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'DEV',
    TAGS: '',
    'client-id': 'auto-test-client',
    clientSecret: '',
    email: 'auto.test@gov.ab.ca',
    password: '',
    tenantName: 'autotest',
  },
  retries: 1,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/form-management-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/form-management-app-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/form-management-app-e2e/results/results-[hash].xml',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:4200',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
