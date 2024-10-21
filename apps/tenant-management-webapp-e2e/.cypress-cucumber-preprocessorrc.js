/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const outputFolder = path.resolve(process.cwd(), '../../dist/cypress/apps/tenant-management-webapp-e2e/cucumber-json');

module.exports = {
  nonGlobalStepDefinitions: false,
  stepDefinitions: [
    path.resolve(process.cwd(), './src/integration/[filepath]/*.step.ts'),
    path.resolve(process.cwd(), './src/integration/[filepath]/*.steps.ts'),
    path.resolve(process.cwd(), './src/integration/common/common.steps.ts'),
  ],
  cucumberJson: {
    generate: true,
    outputFolder: outputFolder,
    filePrefix: '',
    fileSuffix: '.cucumber',
  },
};
