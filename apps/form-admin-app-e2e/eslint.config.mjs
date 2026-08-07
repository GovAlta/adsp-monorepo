import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import baseConfig from '../../eslint.config.mjs';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  ...baseConfig,
  ...compat.extends('plugin:cypress/recommended'),
  {
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'cypress/no-unnecessary-waiting': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/plugins/index.js', 'src/support/multiple-cucumber-html-reporter.js', 'src/support/index.ts'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/camelcase': 'off',
      'no-undef': 'off',
    },
  },
];
