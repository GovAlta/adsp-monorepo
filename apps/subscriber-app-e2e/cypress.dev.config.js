const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    'env-name': 'DEV',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: 'b6aff762-20f8-4c5d-88d3-c38ae16d1937',
    TAGS: '',
  },
  tenantWebAppUrl: 'https://adsp-dev.gov.ab.ca/',
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
    baseUrl: 'https://subscription.adsp-dev.gov.ab.ca/',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
})
