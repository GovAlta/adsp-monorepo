/* eslint-disable */
export default {
  displayName: 'file-service',
  preset: './jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/file-service',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['globalConfig'],
};
