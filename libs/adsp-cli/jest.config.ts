/* eslint-disable */
export default {
  displayName: 'adsp-cli',
  preset: '../../jest-cover.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/adsp-cli',
  // main.ts is the CLI dispatch shim (thin argv -> function calls, exercised manually/via smoke tests, not
  // unit tests) — excluded from coverage so importing it for parseLoginArgs's own tests doesn't drag the
  // global threshold down with its untested dispatch functions.
  coveragePathIgnorePatterns: ['<rootDir>/src/main.ts'],
  testEnvironment: 'node',
};
