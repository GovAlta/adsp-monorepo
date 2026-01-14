/* eslint-disable */;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  displayName: 'status-app',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/status-app',
  moduleNameMapper: {
    '^@components(.*)$': path.resolve(__dirname, './src/app/components/$1'),
    '^@pages(.*)$': path.resolve(__dirname, './src/app/pages/$1'),
    '^@store(.*)$': path.resolve(__dirname, './src/app/store/$1'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!react-markdown|vfile|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|remark-rehype|mdast-util-to-hast|trim-lines|unist-builder|unist-util-visit|unist-util-is|unist-util-position|unist-util-generated|mdast-util-definitions|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|rehype-raw|hast-util-raw|hast-util-from-parse5|hastscript|hast-util-parse-selector|web-namespaces|hast-util-to-parse5|hast-to-hyperscript|zwitch|hast-util-raw|html-void-elements|remark-gfm|mdast-util-gfm|ccount|mdast-util-find-and-replace|escape-string-regexp|mdast-util-to-markdown|markdown-table)',
  ],
};
