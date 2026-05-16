import nextPlugin from '@next/eslint-plugin-next';

import reactConfig from './react.mjs';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
