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
    'node_modules/(?!react-markdown|vfile|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|remark-rehype|mdast-util-to-hast|trim-lines|unist-builder|unist-util-visit|unist-util-is|unist-util-position|unist-util-generated|mdast-util-definitions|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|rehype-raw|hast-util-raw|hast-util-from-parse5|hastscript|hast-util-parse-selector|web-namespaces|hast-util-to-parse5|hast-to-hyperscript|zwitch|hast-util-raw|html-void-elements|remark-gfm|mdast-util-gfm|ccount|mdast-util-find-and-replace|escape-string-regexp|mdast-util-to-markdown|markdown-table)',
  ],
};
