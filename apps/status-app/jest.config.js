/* eslint @typescript-eslint/no-var-requires: "off" */
const { resolve } = require('path');

module.exports = {
  name: 'status-app',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nrwl/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/status-app',

  moduleNameMapper: {
    '^@components(.*)$': resolve(__dirname, './src/app/components/$1'),
    '^@pages(.*)$': resolve(__dirname, './src/app/pages/$1'),
    '^@store(.*)$': resolve(__dirname, './src/app/store/$1'),
  },
};
