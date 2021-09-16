module.exports = {
  name: 'tenant-management-api',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/tenant-management-api',
  testEnvironment: 'node',
  setupFiles: ['./.jest/setEnvVars.js'],
};
