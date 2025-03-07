import google from 'eslint-config-google';
delete google.rules['valid-jsdoc'];
delete google.rules['require-jsdoc'];

import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import js from '@eslint/js';

export default [
  google,
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    ignores: ['coverage/'],
    plugins: {
      jsdoc,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
