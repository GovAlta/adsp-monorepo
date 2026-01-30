const nxPreset = require('@nx/jest/preset').default;
module.exports = {
  ...nxPreset,
  coverageReporters: ['html', 'text', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 79,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
process.env.TZ = 'UTC';
