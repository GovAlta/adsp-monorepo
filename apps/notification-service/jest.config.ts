/* eslint-disable */
export default {
  displayName: 'notification-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/notification-service',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  transform: {
    '^.+\\.hbs$': '../../hbs-raw-loader.js',
  },
};
