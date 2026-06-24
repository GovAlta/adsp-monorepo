/* eslint-disable */
export default {
  displayName: 'jsonforms-components',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    // @mdx-js/mdx, react-markdown and rehype-sanitize are ESM-only; stub them so Jest (babel-jest) can parse tests.
    // clean-code-ignore: RULE-19
    '@mdx-js/mdx': '<rootDir>/src/lib/.jest/mdx-js-stub.js',
    // clean-code-ignore: RULE-19
    'react-markdown': '<rootDir>/src/lib/.jest/react-markdown-stub.jsx',
    // clean-code-ignore: RULE-19
    'rehype-sanitize': '<rootDir>/src/lib/.jest/rehype-sanitize-stub.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/jsonforms-components',
};
