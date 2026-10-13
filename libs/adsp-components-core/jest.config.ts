export default {
  displayName: 'adsp-components-core',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/libs/adsp-components-core',
};
