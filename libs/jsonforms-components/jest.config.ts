/* eslint-disable */
export default {
  displayName: 'jsonforms-components',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    //Need to stub this and ignore
    '@mdx-js/mdx': '<rootDir>/src/lib/.jest/mdx-js-stub.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/jsonforms-components',
};
