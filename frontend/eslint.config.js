import google from 'eslint-config-google';
delete google.rules['valid-jsdoc'];
delete google.rules['require-jsdoc'];

import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
delete reactHooks.configs.recommended.rules['react-hooks/exhaustive-deps'];
import {fixupPluginRules} from '@eslint/compat';

export default [
  google,
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  react.configs.flat.recommended,
  // react.configs.flat.all,
  react.configs.flat['jsx-runtime'], // For React 17+
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['coverage/**/*', 'dist/**/*'],
  },
  {
    files: ['src/**/*.jsx'],
    plugins: {
      jsdoc,
      react,
      'react-hooks': fixupPluginRules(reactHooks),
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
];
