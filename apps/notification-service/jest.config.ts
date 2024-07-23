/* eslint-disable */
export default {
  displayName: 'notification-service',
  preset: '../../jest-cover.preset.js',
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
