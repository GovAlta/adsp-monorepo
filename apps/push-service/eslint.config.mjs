import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    rules: {},
  },
  {
    ignores: ['test'],
  },
];
