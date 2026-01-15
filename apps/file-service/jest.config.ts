/* eslint-disable */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  displayName: 'file-service',
  preset: './jest.preset.js',
  globals: {},
  coverageDirectory: '../../coverage/apps/file-service',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  testEnvironment: 'node'
};
