/* eslint-disable */
export default {
  displayName: 'jsonforms-components',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    //Need to stub out these libraries to run the tests
    '@mdx-js/mdx': '<rootDir>/src/lib/.jest/mdx-js-stub.js',
    'react-markdown': '<rootDir>/src/lib/.jest/react-markdown-stub.js',
    'rehype-sanitize': '<rootDir>/src/lib/.jest/rehype-sanitize-stub.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/jsonforms-components',
};
