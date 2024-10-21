/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const outputFolder = path.resolve(process.cwd(), '../../dist/cypress/apps/status-app-e2e/cucumber-json');

module.exports = {
  nonGlobalStepDefinitions: true,
  stepDefinitions: [path.resolve(process.cwd(), './src/integration/[filepath]/*.step.ts')],
  cucumberJson: {
    generate: true,
    outputFolder: outputFolder,
    filePrefix: '',
    fileSuffix: '.cucumber',
  },
};
