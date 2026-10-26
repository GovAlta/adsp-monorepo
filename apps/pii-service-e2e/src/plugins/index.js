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
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    },
    htmlReport({ violations, axeHtmlReporterOptions }) {
      createHtmlReport({ results: { violations: violations }, options: axeHtmlReporterOptions });
      return null;
    },
  });

  return config;
};
