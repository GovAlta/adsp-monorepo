module.exports = {
  displayName: 'status-service',
  preset: './jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/status-service',
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['globalConfig'],
};
