const nxPreset = require('@nx/jest/preset').default;
module.exports = {
  ...nxPreset,
  coverageReporters: ['html', 'text', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
};
process.env.TZ = 'UTC';
