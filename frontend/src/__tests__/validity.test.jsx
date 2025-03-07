/*
#######################################################################
#
# Copyright (C) 2020-2025 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
/*
#######################################################################
#######               DO NOT MODIFY THIS FILE               ###########
#######################################################################
*/

import {it, test, expect} from 'vitest';
import {render} from '@testing-library/react';

import fs from 'fs';
import {readdir} from 'node:fs/promises';
import strip from 'strip-comments';

import App from '../App';

const contains = async (text, trim = false) => {
  let cnt = 0;
  const files = await readdir('src', {recursive: true});
  for (const file of files) {
    if ((!file.startsWith(`__tests__`)) &&
        (!file.startsWith(`main.jsx`)) &&
        ((file.endsWith(`.jsx`) || file.endsWith(`.js`)))) {
      const data = fs.readFileSync(`src/${file}`, {encoding: 'utf8'});
      let src = strip(data).replace(/(\r\n|\n|\r)/gm, '');
      if (trim) {
        src = src.replaceAll(' ', '');
      }
      if (src.includes(text)) {
        cnt++;
      }
    }
  }
  return cnt;
};

const testing = async (text) => {
  let cnt = 0;
  const files = await readdir('src/__tests__', {recursive: true});
  for (const file of files) {
    if (!file.startsWith(`validity.test`)) {
      const data = fs.readFileSync(`src/__tests__/${file}`, {encoding: 'utf8'});
      const src = strip(data).replace(/(\r\n|\n|\r)/gm, '');
      if (src.includes(text)) {
        cnt++;
      }
    }
  }
  return cnt;
};

test('Nothing extends React.Component', async () => {
  expect(await contains('extends React.Component')).toBe(0);
});
test('Nothing extends imported Component', async () => {
  expect(await contains('extends Component')).toBe(0);
});

it('Uses Material UI', async () => {
  render(<App />);
  const elements = document.querySelectorAll('[class^=Mui]');
  expect(elements.length).toBeGreaterThan(9);
});

it('Uses Context', async () => {
  expect(await contains('createContext')).toBeGreaterThan(0);
});
it('Uses useState Hook', async () => {
  expect(await contains('useState')).toBeGreaterThan(0);
});

it('Does not use this.state', async () => {
  expect(await contains('this.state')).toBe(0);
});
it('Does not use this.setState', async () => {
  expect(await contains('this.setState')).toBe(0);
});

// If you have a variable like 'valid' you'll get false positives
// so either change it to something like 'ok' or assign values with
// (valid) = true; rather than valid = true;
it('Does not use element ids', async () => {
  expect(await contains('id=', true)).toBe(0);
});
it('Does not use getElementById', async () => {
  expect(await contains('getElementById')).toBe(0);
});
it('Does not use data-testid', async () => {
  expect(await contains('data-testid')).toBe(0);
});

// Case sensitive because <Table> is a React compoinent, not an HTML element
it('Does not use table elements', async () => {
  expect(await contains('<table>', true)).toBe(0);
});

it('Tests with ByText', async () => {
  expect(await testing('ByText')).toBeGreaterThan(0);
});
it('Tests with ByLabelText', async () => {
  expect(await testing('ByLabelText')).toBeGreaterThan(0);
});
it('Does not test with ByTestId', async () => {
  expect(await testing('ByTestId')).toBe(0);
});

/*
 * Should NOT be using Props in lieu of state/context.
 *
 * However, a small number should be being used as to not do so
 * suggests the implementation is using state/context inappropriately,
 * typically for invariant data that should not be held as state.
 *
 * If using a version of node earlier than v20 this test will pass
 * even if you are using Props, so make aure you have an up-to-date
 * version of node or you may get a nasty shock from the autograder.
 */
test('Not Too Few (<1) or Too Many (>8) Components Using Props', async () => {
  const files = await readdir('src', {recursive: true});
  let cnt = 0;
  for (const file of files) {
    if ((!file.startsWith(`__tests__`)) && file.endsWith(`.jsx`)) {
      const data = fs.readFileSync(`src/${file}`, {encoding: 'utf8'});
      if (data.includes('PropTypes') ||
        data.includes('propTypes') ||
        data.includes('prop-types')) {
        cnt++;
      }
    }
  }
  expect(cnt).toBeGreaterThan(0);
  expect(cnt).toBeLessThan(9);
});
