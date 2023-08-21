/* eslint-disable */
export default {
  displayName: 'status-service',
  preset: './jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/status-service',
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['globalConfig'],
};
