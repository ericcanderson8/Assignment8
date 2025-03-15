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

  // Click the submit button
  await page.click('button[type="submit"]');
});


test('Switch workspace', async () => {
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

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the workspace menu button to be visible
  await page.waitForSelector('button[aria-label="workspace-menu"]', {
    visible: true,
    timeout: 5000,
  });

  // Now click the workspace menu button
  await page.click('button[aria-label="workspace-menu"]');
  // Wait for the CSE 186 workspace option to be visible
  await page.waitForSelector('li[aria-label="View workspace: CSE 186"]', {
    visible: true,
    timeout: 5000,
  });

  // Click the CSE 186 workspace option
  await page.click('li[aria-label="View workspace: CSE 186"]');
  // check if cse186 is there
});

test('Minimize and maximize channels', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

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

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click the Channels heading
  await page.evaluate(() => {
    const headings =
        Array.from(document.querySelectorAll('h6.MuiTypography-root'));
    const channelsHeading = headings.find((h) =>
      h.textContent.includes('Channels'));
    if (channelsHeading) channelsHeading.click();
  });

  // Wait for # General to not be visible
  await page.waitForFunction(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return !elements.some((el) =>
      el.textContent &&
      el.textContent.includes('# General') &&
      window.getComputedStyle(el).display !== 'none',
    );
  }, {timeout: 5000});

  // Check that # General is not visible
  const generalChannelVisible = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.some((el) =>
      el.textContent && el.textContent.includes('# General') &&
      window.getComputedStyle(el).display !== 'none',
    );
  });
  console.log('# General channel visible:', generalChannelVisible);
  // Assert that the General channel is not visible
  if (generalChannelVisible) {
    throw new Error(`# General channel is
      still visible after minimizing Channels`);
  }
});

// make a test to minimize and maximize dms
test('Minimize and maximize DMs', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

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

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click the Channels heading
  await page.evaluate(() => {
    const headings =
        Array.from(document.querySelectorAll('h6.MuiTypography-root'));
    const channelsHeading = headings.find((h) =>
      h.textContent.includes('Direct Messages'));
    if (channelsHeading) channelsHeading.click();
  });

  // Wait for # General to not be visible
  await page.waitForFunction(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return !elements.some((el) =>
      el.textContent &&
      el.textContent.includes('Admin User') &&
      window.getComputedStyle(el).display !== 'none',
    );
  }, {timeout: 5000});

  // Check that # General is not visible
  const adminUserVisible = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.some((el) =>
      el.textContent && el.textContent.includes('Admin User') &&
      window.getComputedStyle(el).display !== 'none',
    );
  });
  console.log('Admin User visible:', adminUserVisible);
  // Assert that the General channel is not visible
  if (adminUserVisible) {
    throw new Error(`Admin User is
      still visible after minimizing DMs`);
  }
});


test('Open and close a channel', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the channel # General
  await page.evaluate(() => {
    const listItems =
        Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('#') && text.includes('General');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });

  // Wait for and click the back button
  await page.waitForSelector('button[aria-label="back"]', {
    visible: true,
    timeout: 5000,
  });
  await page.click('button[aria-label="back"]');

  // Wait for the channels list to be visible again
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });
});

// test('Open and close a DM', async () => {
//   // Wait for the login page to load with the Sign In heading
//   await page.waitForFunction(
//       'document.querySelector("h1").innerText.includes("Sign In")');

//   // Fill in the login form using Puppeteer's form filling methods
//   await page.type('input[name="email"]', 'molly@books.com');
//   await page.type('input[name="password"]', 'mollymember');

//   // Small delay to ensure form is fully filled
//   //   await page.waitForTimeout(500);

//   // Click the submit button
//   await page.click('button[type="submit"]');

//   // Wait for the Channels heading to be visible
//   await page.waitForSelector('h6.MuiTypography-root', {
//     visible: true,
//     timeout: 5000,
//   });

//   // Click on the dm with Anna
//   await page.evaluate(() => {
//     const listItems =
//         Array.from(document.querySelectorAll('li.MuiListItem-root'));
//     const generalChannel = listItems.find((li) => {
//       const text = li.textContent;
//       return text.includes('Anna');
//     });
//     if (generalChannel) {
//       console.log('Found General channel, clicking...');
//       generalChannel.click();
//     } else {
//       console.log('General channel not found');
//     }
//   });

//   // Wait for and click the back button
//   await page.waitForSelector('button[aria-label="back"]', {
//     visible: true,
//     timeout: 5000,
//   });
//   await page.click('button[aria-label="back"]');

//   // Wait for the channels list to be visible again
//   await page.waitForSelector('h6.MuiTypography-root', {
//     visible: true,
//     timeout: 5000,
//   });
// });


// test('logging out', async () => {
//   // Wait for the login page to load with the Sign In heading
//   await page.waitForFunction(
//       'document.querySelector("h1").innerText.includes("Sign In")');

//   // Fill in the login form using Puppeteer's form filling methods
//   await page.type('input[name="email"]', 'molly@books.com');
//   await page.type('input[name="password"]', 'mollymember');

//   // Small delay to ensure form is fully filled
//   //   await page.waitForTimeout(500);

//   // Click the submit button
//   await page.click('button[type="submit"]');

//   // Wait for the Channels heading to be visible
//   await page.waitForSelector('h6.MuiTypography-root', {
//     visible: true,
//     timeout: 5000,
//   });

//   // Click on the logout button
//   await page.click('button[aria-label="logout"]');

//   // Wait for the login page to load with the Sign In heading
//   await page.waitForFunction(
//       'document.querySelector("h1").innerText.includes("Sign In")');
// });


test('Open and press home button', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the dm with Anna
  await page.evaluate(() => {
    const listItems =
        Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('Anna');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });

  // Wait for and click the back button
  await page.waitForSelector('button[aria-label="back"]', {
    visible: true,
    timeout: 5000,
  });
  await page.click('button[aria-label="go home"]');

  // Wait for the channels list to be visible again
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });
});

test('Open a DM and send a message', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the dm with Anna
  await page.evaluate(() => {
    const listItems =
        Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('Anna');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });

  // Wait for and click the back button

  // Wait for the message input field to be visible
  await page.waitForSelector('input[placeholder="Message Anna"]', {
    visible: true,
    timeout: 5000,
  });

  // Type a message in the input field
  await page.type('input[placeholder="Message Anna"]', 'Hello, Anna!');

  // Click the send message button
  await page.click('button[aria-label="send message"]');
});

// open a channel and send a message
test('Open a channel and send a message', async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the dm with Anna
  await page.evaluate(() => {
    const listItems =
        Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('#') && text.includes('General');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });

  // Wait for and click the back button

  // Wait for the message input field to be visible
  await page.waitForSelector('input[placeholder="Message # General"]', {
    visible: true,
    timeout: 5000,
  });

  // Type a message in the input field
  await page.type('input[placeholder="Message # General"]', 'Hello, Anna!');

  // Click the send message button
  await page.click('button[aria-label="send message"]');
});

test(`Open a channel and send a message open it with an alternate account
  `, async () => {
  // Wait for the login page to load with the Sign In heading
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'molly@books.com');
  await page.type('input[name="password"]', 'mollymember');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the dm with Anna
  await page.evaluate(() => {
    const listItems =
        Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('#') && text.includes('General');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });

  // Wait for and click the back button

  // Wait for the message input field to be visible
  await page.waitForSelector('input[placeholder="Message # General"]', {
    visible: true,
    timeout: 5000,
  });

  // Type a message in the input field
  await page.type('input[placeholder="Message # General"]', 'Hello, Anna!');

  // Click the send message button
  await page.click('button[aria-label="send message"]');

  await page.waitForSelector('button[aria-label="logout"]', {
    visible: true,
    timeout: 5000,
  });
  await page.click('button[aria-label="logout"]');

  // Wait for the channels list to be visible again
  await page.waitForFunction(
      'document.querySelector("h1").innerText.includes("Sign In")');

  // Fill in the login form using Puppeteer's form filling methods
  await page.type('input[name="email"]', 'anna@books.com');
  await page.type('input[name="password"]', 'annaadmin');

  // Small delay to ensure form is fully filled
  //   await page.waitForTimeout(500);

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for the Channels heading to be visible
  await page.waitForSelector('h6.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Click on the dm with Anna
  await page.evaluate(() => {
    const listItems =
      Array.from(document.querySelectorAll('li.MuiListItem-root'));
    const generalChannel = listItems.find((li) => {
      const text = li.textContent;
      return text.includes('#') && text.includes('General');
    });
    if (generalChannel) {
      console.log('Found General channel, clicking...');
      generalChannel.click();
    } else {
      console.log('General channel not found');
    }
  });
  // check that the message is there
  await page.waitForSelector('p.MuiTypography-root', {
    visible: true,
    timeout: 5000,
  });

  // Verify the message content exists
  const messageExists = await page.evaluate(() => {
    const paragraphs =
     Array.from(document.querySelectorAll('p.MuiTypography-root'));
    return paragraphs.some((p) => p.textContent.includes('Hello, Anna!'));
  });

  console.log('Message "Hello, Anna!" exists:', messageExists);

  // Assert that the message exists
  if (!messageExists) {
    throw new Error('Message "Hello, Anna!" was not found in the chat');
  }
});

