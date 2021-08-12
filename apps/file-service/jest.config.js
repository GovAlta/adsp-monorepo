module.exports = {
  name: 'file-service',
  preset: '../../jest.config.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/apps/file-service',
};
