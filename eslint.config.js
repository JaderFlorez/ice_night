import ts from 'typescript-eslint';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js'],
  },
  {
    files: ['backend/**/*.ts', 'frontend/**/*.ts', 'frontend/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
