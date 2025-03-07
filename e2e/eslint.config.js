import google from 'eslint-config-google';
delete google.rules['valid-jsdoc'];
delete google.rules['require-jsdoc'];

import jsdoc from 'eslint-plugin-jsdoc';
import js from '@eslint/js';
import globals from 'globals';

export default [
  google,
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    plugins: {
      jsdoc,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
