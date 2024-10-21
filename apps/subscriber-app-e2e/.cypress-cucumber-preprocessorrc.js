/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  nonGlobalStepDefinitions: true,
  stepDefinitions: [path.resolve(process.cwd(), './src/integration/[filepath]/*.step.ts')],
  html: {
    enabled: true,
    output: path.resolve(process.cwd(), '../../dist/cypress/apps/subscriber-app-e2e/report/index.html'),
  },
};
