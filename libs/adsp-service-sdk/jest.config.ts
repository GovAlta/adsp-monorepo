/* eslint-disable */
export default {
  displayName: 'adsp-service-sdk',
  preset: '../../jest-cover.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/adsp-service-sdk',
  testEnvironment: 'node',
};
