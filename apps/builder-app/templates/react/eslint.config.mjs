import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: ['dist', 'node_modules', 'webpack*.js'],
  },
];
