import baseConfig from '../../eslint.config.mjs';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'vue', 'vue/*', '@angular/*'],
              message:
                'adsp-components-core must stay framework-independent; framework code belongs in an adapter library such as adsp-components-react.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      // Not imported: consumers load its tokens.css, which the theme values reference.
      '@nx/dependency-checks': ['error', { ignoredDependencies: ['@abgov/design-tokens'] }],
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
];
