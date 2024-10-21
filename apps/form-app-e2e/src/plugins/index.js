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

const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { preprendTransformerToOptions } = require('@badeball/cypress-cucumber-preprocessor/browserify');
const browserify = require('@cypress/browserify-preprocessor');
const resolve = require('resolve');
const clipboardy = require('clipboardy');
const { createHtmlReport } = require('axe-html-reporter');

module.exports = async (on, config) => {
  const options = {
    ...preprendTransformerToOptions(config, browserify.defaultOptions),
    typescript: resolve.sync('typescript', { baseDir: config.projectRoot }),
  };
  options.browserifyOptions.plugin.unshift(['tsify']);

  // NOTE: This is to address cypress event listener merging:
  // https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/event-handlers.md
  let cucumberListeners;
  const emitter = (event, listeners) => {
    if (event === 'task') {
      cucumberListeners = listeners;
    } else {
      on(event, listeners);
    }
  };
  await addCucumberPreprocessorPlugin(emitter, config);

  on('file:preprocessor', browserify(options));
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--disable-dev-shm-usage');
      return launchOptions;
    }
  });
  on('task', {
    ...cucumberListeners,
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

  return config;
};
