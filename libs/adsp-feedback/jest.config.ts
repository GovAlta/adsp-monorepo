/* eslint-disable */
export default {
  displayName: 'adsp-feedback',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
    // Added this line to ensure lit-html is transformed
  transformIgnorePatterns: [
    '/node_modules/(?!lit-html|lit-html/directives)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/adsp-feedback',
};

