/* eslint-disable */
export default {
  displayName: 'value-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/value-service',
  testEnvironment: 'node',
};
