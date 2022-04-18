// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const cucumber = require('cypress-cucumber-preprocessor').default;
const browserify = require('@cypress/browserify-preprocessor');
const resolve = require('resolve');
const clipboardy = require('clipboardy');
import { createHtmlReport } from 'axe-html-reporter';

module.exports = (on, config) => {
  const options = {
    ...browserify.defaultOptions,
    typescript: resolve.sync('typescript', { baseDir: config.projectRoot }),
  };
  options.browserifyOptions.plugin.unshift(['tsify']);
  on('file:preprocessor', cucumber(options));
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--disable-dev-shm-usage');
      return launchOptions;
    }
  });
  on('task', {
    async getClipboard() {
      return clipboardy.read();
    },
    // logs message to console
    log(message) {
      console.log(message);

      return null;
    },
    // logs message as table to console
    table(message) {
      console.table(message);

      return null;
    },
    // must be created as a task since it required the fs lib which is not accessible via the browser
    htmlReport({ violations, axeHtmlReporterOptions }) {
      createHtmlReport({ results: { violations: violations }, options: axeHtmlReporterOptions });

      return null;
    },
  });
};
