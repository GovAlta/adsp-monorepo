import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.lib.json', './tsconfig.spec.json'],
      },
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@abgov/react-components',
            '@abgov/react-components-ds1',
            '@abgov/react-components-new',
          ],
          ignoredFiles: ['libs/jsonforms-components/rollup.config.js'],
        },
      ],
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
];
