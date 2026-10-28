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
  // @fullcalendar/react, @full-ui/headless-calendar, temporal-polyfill and temporal-utils ship ESM-only; let babel transform them.
  transformIgnorePatterns: ['node_modules/(?!(@fullcalendar|@full-ui|temporal-polyfill|temporal-utils)/)'],
};
