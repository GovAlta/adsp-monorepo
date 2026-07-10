/* eslint-disable */
export default {
  displayName: 'subscriber-app',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    '^@abgov/react-components$': '@abgov/react-components',
    '^@abgov/react-components-ds1$': '@abgov/react-components-ds1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/subscriber-app',
};
