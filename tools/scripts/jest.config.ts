/* eslint-disable */
export default {
  displayName: 'tools',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/tools',
  testEnvironment: 'node',
};
