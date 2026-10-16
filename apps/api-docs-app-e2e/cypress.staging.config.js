const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'UAT',
    TAGS: '',
  },
  retries: 1,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/api-docs-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/api-docs-app-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/api-docs-app-e2e/results/results-[hash].xml',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://api.adsp-uat.alberta.ca',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
