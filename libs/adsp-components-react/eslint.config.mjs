import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
];
