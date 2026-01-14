/* eslint-disable */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  displayName: 'tenant-management-api',
  preset: './jest.preset.js',
  globals: {},
  coverageDirectory: '../../coverage/apps/tenant-management-api',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
    '^@keycloak/keycloak-admin-client$': '<rootDir>/.jest/keycloak-stub.js'
  },
  testEnvironment: 'node',
  setupFiles: ['./.jest/setEnvVars.js'],
};
