// clean-code-ignore: RULE-19 — Jest config, not application logic; nothing to unit test.
export default {
  displayName: 'adsp-components-core',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/adsp-components-core',
};
