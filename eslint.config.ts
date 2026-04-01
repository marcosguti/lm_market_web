import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  {
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      'jsx-a11y': jsxA11yPlugin,
      perfectionist,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      eqeqeq: 'error',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'no-console': 'error',
      'object-shorthand': ['error', 'always'],
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: false,
          avoidEscape: true,
        },
      ],
      'react-hooks/preserve-manual-memoization': 'off',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { children: 'never', props: 'never' }],
      'react/jsx-no-useless-fragment': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': ['error', { component: true, html: true }],
      ...perfectionist.configs['recommended-alphabetical'].rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
