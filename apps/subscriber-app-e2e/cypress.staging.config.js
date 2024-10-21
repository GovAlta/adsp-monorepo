const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    'env-name': 'UAT',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: '2ef492af-0a16-470b-9ea5-c8bfa7b08a7c',
    TAGS: '',
  },
  tenantWebAppUrl: 'https://adsp-uat.alberta.ca/',
  defaultCommandTimeout: 10000,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/subscriber-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/subscriber-app-e2e/screenshots',
  chromeWebSecurity: false,
  videoUploadOnPasses: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile:
      '../../dist/cypress/apps/subscriber-app-e2e/results/results-[hash].xml',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config)
    },
    baseUrl: 'https://subscription.adsp-uat.alberta.ca/',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
})
