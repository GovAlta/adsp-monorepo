/* eslint-disable */
import { createRequire } from 'node:module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export default {
  displayName: 'tenant-management-webapp',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/tenant-management-webapp',

  moduleNameMapper: {
    '^@abgov/react-components$': '@abgov/react-components',
    '^@abgov/react-components-ds1$': '@abgov/react-components-ds1',
    '^@components(.*)$': path.resolve(__dirname, './src/app/components/$1'),
    '^@assets(.*)$': path.resolve(__dirname, './src/assets/$1'),
    '^@icons(.*)$': path.resolve(__dirname, './src/assets/icons/$1'),
    '^@lib(.*)$': path.resolve(__dirname, './src/app/lib/$1'),
    '^@pages(.*)$': path.resolve(__dirname, './src/app/pages/$1'),
    '^@store(.*)$': path.resolve(__dirname, './src/app/store/$1'),
    '^uuid$': require.resolve('uuid'),
    // clean-code-ignore: RULE-19
    // @mdx-js/mdx, react-markdown and rehype-sanitize are ESM-only; stub them so Jest (babel-jest) can parse tests.
    '@mdx-js/mdx': '<rootDir>/../../libs/jsonforms-components/src/lib/.jest/mdx-js-stub.js',
    // clean-code-ignore: RULE-19
    'react-markdown': '<rootDir>/../../libs/jsonforms-components/src/lib/.jest/react-markdown-stub.jsx',
    // clean-code-ignore: RULE-19
    'rehype-sanitize': '<rootDir>/../../libs/jsonforms-components/src/lib/.jest/rehype-sanitize-stub.js',
  },
  transformIgnorePatterns: [
    // clean-code-ignore: 2.3
    'node_modules/(?!react-markdown|vfile|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|remark-rehype|mdast-util-to-hast|trim-lines|unist-builder|unist-util-visit|unist-util-is|unist-util-position|unist-util-generated|mdast-util-definitions|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|rehype-raw|hast-util-raw|hast-util-from-parse5|hastscript|hast-util-parse-selector|web-namespaces|hast-util-to-parse5|hast-to-hyperscript|zwitch|hast-util-raw|html-void-elements|remark-gfm|mdast-util-gfm|ccount|mdast-util-find-and-replace|escape-string-regexp|mdast-util-to-markdown|markdown-table|rehype-sanitize|hast-util-sanitize)',
  ],
};
