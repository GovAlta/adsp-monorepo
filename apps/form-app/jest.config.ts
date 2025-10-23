/* eslint-disable */
export default {
  displayName: 'form-app',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    //Need to stub mdx-js and ignore running tests against mdx-js library
    '@mdx-js/mdx': '../../libs/jsonforms-components/src/lib/.jest/mdx-js-stub.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/form-app',
  transformIgnorePatterns: [
    'node_modules/(?!react-markdown)',
  ],
};
