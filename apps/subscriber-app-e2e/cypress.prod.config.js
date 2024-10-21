const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    'env-name': 'PROD',
    email: 'auto.test@gov.ab.ca',
    password: '',
    realm: '6b1dd8dc-fb74-4251-a5b8-7f0920dd4166',
    TAGS: '',
  },
  tenantWebAppUrl: 'https://adsp.alberta.ca/',
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
    baseUrl: 'https://subscription.adsp.alberta.ca/',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
})
