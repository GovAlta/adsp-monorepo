module.exports = {
  name: 'notification-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/notification-service',
  testEnvironment: 'node',
  transform: {
    '^.+\\.hbs$': '../../hbs-raw-loader.js',
  }
};
