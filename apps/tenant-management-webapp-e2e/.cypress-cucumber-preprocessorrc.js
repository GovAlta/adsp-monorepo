/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  nonGlobalStepDefinitions: false,
  stepDefinitions: [
    path.resolve(process.cwd(), './src/integration/[filepath]/*.step.ts'),
    path.resolve(process.cwd(), './src/integration/[filepath]/*.steps.ts'),
    path.resolve(process.cwd(), './src/integration/common/common.steps.ts'),
  ],
  html: {
    enabled: true,
    output: path.resolve(process.cwd(), '../../dist/cypress/apps/tenant-management-webapp-e2e/report/index.html'),
  },
};
