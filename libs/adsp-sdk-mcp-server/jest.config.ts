/* eslint-disable */
export default {
  displayName: 'adsp-sdk-mcp-server',
  preset: '../../jest-cover.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/adsp-sdk-mcp-server',
  testEnvironment: 'node',
};
