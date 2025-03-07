import {test, beforeAll, afterAll, beforeEach, afterEach} from 'vitest';
import puppeteer from 'puppeteer';
import path from 'path';
import express from 'express';
import http from 'http';

import 'dotenv/config';

// // Set environment variable to use normal database instead of test database
// process.env.USE_NORMAL_DB = 'true';

// // Set environment variable to disable database reset in tests
// process.env.E2E_TEST = 'true';

import app from '../../backend/src/app.js';

let backend;
let frontend;
let browser;
let page;

beforeAll(() => {
  backend = http.createServer(app);
  backend.listen(3010, () => {
    console.log('Backend Running at http://localhost:3010');
  });
  frontend = http.createServer(
      express()
          .use('/assets', express.static(
              path.join(__dirname, '..', '..', 'frontend', 'dist', 'assets')))
          .get('*', function(req, res) {
            res.sendFile('index.html',
                {root: path.join(__dirname, '..', '..', 'frontend', 'dist')});
          }),
  );
  frontend.listen(3000, () => {
    console.log('Frontend Running at http://localhost:3000');
  });
});

afterAll(async () => {
  await backend.close();
  await frontend.close();
  setImmediate(function() {
    frontend.emit('close');
  });
});

beforeEach(async () => {
  browser = await puppeteer.launch({
    // headless: true,
    /*
     * Use these two settings instead of the one above if you want to see the
     * browser. However, in the grading system e2e test run headless, so make
     * sure they work that way before submitting.
     */
    headless: false,
    // slowMo: 100,
  });
  page = await browser.newPage();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  const childProcess = browser.process();
  if (childProcess) {
    await childProcess.kill(9);
  }
});

test('Login Functionality', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Take a screenshot to see what's on the page
  await page.screenshot({path: 'login-page.png'});

  // Check if the form fields exist
  const emailExists = await page.evaluate(() => {
    const input = document.querySelector('input[name="email"]');
    return !!input;
  });
  console.log('Email input exists:', emailExists);

  const passwordExists = await page.evaluate(() => {
    const input = document.querySelector('input[name="password"]');
    return !!input;
  });
  console.log('Password input exists:', passwordExists);

  const submitExists = await page.evaluate(() => {
    const button = document.querySelector('button[type="submit"]');
    return !!button;
  });
  console.log('Submit button exists:', submitExists);

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Take another screenshot after filling the form
  await page.screenshot({path: 'login-form-filled.png'});

  // Click the submit button
  await page.click('button[type="submit"]');
});
