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
};
