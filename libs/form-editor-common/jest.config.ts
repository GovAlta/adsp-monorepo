/* eslint-disable */
export default {
  displayName: 'form-editor-common',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    //Need to stub mdx-js and ignore running tests against mdx-js library
    '@mdx-js/mdx': '<rootDir>/src/lib/.jest/mdx-js-stub.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/form-editor-common',
};
