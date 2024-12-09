const { defineConfig } = require('cypress')

module.exports = defineConfig({
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: true,
  videosFolder: '../../dist/cypress/apps/form-admin-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/form-admin-app-e2e/screenshots',
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {},
    specPattern: './src/integration/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: './src/support/index.ts',
  },
})
