import nestConfig from '@repo/config/eslint/nestjs';

export default [
  ...nestConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
