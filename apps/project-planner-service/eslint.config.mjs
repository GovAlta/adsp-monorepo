import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {},
    languageOptions: {
      parserOptions: {
        project: ['apps/project-planner-service/tsconfig.*?.json'],
      },
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {},
  },
];
