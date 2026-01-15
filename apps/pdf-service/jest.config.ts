/* eslint-disable */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  displayName: 'pdf-service',
  preset: '../../jest-cover.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.hbs$': '../../hbs-raw-loader.js',
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/pdf-service',
};
