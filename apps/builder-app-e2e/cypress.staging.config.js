const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'UAT',
    TAGS: '',
    email: 'auto.test@gov.ab.ca',
    password: '',
    tenantName: 'autotest',
    realm: '2ef492af-0a16-470b-9ea5-c8bfa7b08a7c',
  },
  retries: 1,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/builder-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/builder-app-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: '../../dist/cypress/apps/builder-app-e2e/results/results-[hash].xml',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'https://builder.adsp-uat.alberta.ca',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
