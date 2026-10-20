export default {
  displayName: 'adsp-components-react',
  preset: '../../jest-cover.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/adsp-components-react',
  // The core library is imported from source and has its own tests and coverage.
  coveragePathIgnorePatterns: ['/node_modules/', '/libs/adsp-components-core/'],
};
