'use strict';

const gtsConfig = require('gts/build/src/index.js');
const {defineConfig} = require('eslint/config');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'out/**',
      'node_modules/**',
      '.vscode-test/**',
      'coverage/**',
      '*.d.ts',
    ],
  },
  ...gtsConfig,
  {
    files: ['**/*.ts'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {prefer: 'type-imports', fixStyle: 'inline-type-imports'},
      ],
    },
  },
]);
