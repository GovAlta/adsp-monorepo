/* eslint-disable */
export default {
  displayName: 'push-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/push-service',
  testEnvironment: 'node',
};
