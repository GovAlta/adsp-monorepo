/* eslint-disable */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  displayName: 'export-service',
  preset: '../../jest-cover.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/export-service',
};
