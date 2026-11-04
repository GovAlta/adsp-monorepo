import path from 'path';

export default {
  displayName: 'project-planner-app',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleNameMapper: {
    '^@abgov/react-components$': '@abgov/react-components',
    '^@components(.*)$': path.resolve(__dirname, './src/app/components/$1'),
    '^@icons(.*)$': path.resolve(__dirname, './src/assets/icons/$1'),
    '^@store(.*)$': path.resolve(__dirname, './src/app/store/$1'),
    '^@style(.*)$': path.resolve(__dirname, '../../libs/stylesheets/scss/src/lib/$1'),
    '^uuid$': require.resolve('uuid'),
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/project-planner-app',
};
