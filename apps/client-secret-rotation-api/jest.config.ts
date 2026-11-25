/* eslint-disable */
export default {
  displayName: 'client-secret-rotation-api',
  preset: '../../jest-cover.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/client-secret-rotation-api',
};
