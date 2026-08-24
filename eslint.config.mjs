import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import jsoncEslintParser from 'jsonc-eslint-parser';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,
  ...compat.extends(
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ),
  ...nx.configs['flat/base'],
  { plugins: { '@typescript-eslint': typescriptEslintEslintPlugin } },
  {
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    files: ['**/*.preset.js'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    // Disable new ESLint 9 / typescript-eslint v8 preset defaults not previously user-configured
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-private-class-members': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
  {
    // Standalone Node scripts under tools/ run directly, outside any nx project.
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  {
    ignores: ['dist', '**/*.config.js', '**/*.config.mjs', '**/*.config.old.js'],
  },
];
