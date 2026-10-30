const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'PROD',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: '2ef492af-0a16-470b-9ea5-c8bfa7b08a7c',
    tenantName: 'autotest',
    TAGS: '',
  },
  retries: 1,
  tenantWebAppUrl: 'https://adsp.alberta.ca/',
  defaultCommandTimeout: 10000,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/task-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/task-app-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/task-app-e2e/results/results-[hash].xml',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://task.adsp.alberta.ca/',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
