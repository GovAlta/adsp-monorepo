module.exports = {
  name: 'file-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/apps/file-service',
};
