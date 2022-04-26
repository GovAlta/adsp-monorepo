const { resolve } = require('path');

module.exports = {
  name: 'tenant-management-webapp',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nrwl/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/tenant-management-webapp',

  moduleNameMapper: {
    '^@components(.*)$': resolve(__dirname, './src/app/components/$1'),
    '^@assets(.*)$': resolve(__dirname, './src/assets/$1'),
    '^@icons(.*)$': resolve(__dirname, './src/assets/icons/$1'),
    '^@lib(.*)$': resolve(__dirname, './src/app/lib/$1'),
    '^@pages(.*)$': resolve(__dirname, './src/app/pages/$1'),
    '^@store(.*)$': resolve(__dirname, './src/app/store/$1'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!react-markdown|vfile|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|remark-rehype|mdast-util-to-hast|unist-builder|unist-util-visit|unist-util-is|unist-util-position|unist-util-generated|mdast-util-definitions|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|rehype-raw|hast-util-raw|hast-util-from-parse5|hastscript|hast-util-parse-selector|web-namespaces|hast-util-to-parse5|hast-to-hyperscript|zwitch|hast-util-raw|html-void-elements)',
  ],
};
