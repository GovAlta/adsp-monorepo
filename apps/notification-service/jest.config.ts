/* eslint-disable */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  displayName: 'notification-service',
  preset: './jest.preset.js',
  globals: {},
  coverageDirectory: '../../coverage/apps/notification-service',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  transform: {
    '^.+\\.hbs$': '../../hbs-raw-loader.js',
  },
};
