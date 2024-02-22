/* eslint-disable */
export default {
  displayName: 'configuration-service',
  preset: '../../jest-cover.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/configuration-service',
  testEnvironment: 'node',
};
