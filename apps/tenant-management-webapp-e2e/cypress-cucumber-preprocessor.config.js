/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const stepDefinitionsPath = path.resolve(process.cwd(), './src/integration');
const outputFolder = path.resolve(process.cwd(), '../../dist/cypress/apps/tenant-management-webapp-e2e/cucumber-json');

module.exports = {
  nonGlobalStepDefinitions: true,
  stepDefinitions: stepDefinitionsPath,
  cucumberJson: {
    generate: true,
    outputFolder: outputFolder,
    filePrefix: '',
    fileSuffix: '.cucumber',
  },
};
