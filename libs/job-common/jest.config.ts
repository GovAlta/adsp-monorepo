import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/* eslint-disable */
export default {
  displayName: 'job-common',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/job-common',
};
