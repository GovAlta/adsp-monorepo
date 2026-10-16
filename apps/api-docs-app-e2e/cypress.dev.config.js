const { defineConfig } = require('cypress');

module.exports = defineConfig({
  env: {
    'env-name': 'DEV',
    TAGS: '',
  },
  retries: 0,
  defaultCommandTimeout: 10000,
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  videosFolder: '../../dist/cypress/apps/api-docs-app-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/api-docs-app-e2e/screenshots',
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:3001',
    specPattern: './src/integration/**/*.feature',
    supportFile: './src/support/index.ts',
    excludeSpecPattern: '*.js',
  },
});
