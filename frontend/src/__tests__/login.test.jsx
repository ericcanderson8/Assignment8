import {it, expect, beforeAll, afterAll, afterEach} from 'vitest';
// expect,
import {setupServer} from 'msw/node';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
/* , screen, waitFor, fireEvent*/
import {http, HttpResponse} from 'msw';
import App from '../App';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// const URL = 'http://localhost:3010/api/v0';

it('renders the App component', async () => {
  render(<App />);
});

it('renders login page', () => {
  render(<App />);
  // Check for login heading
  //  expect(screen.getByText('Sign In')).toBeInTheDocument();
  // Check for email and password fields
  server.use(
      http.get('http://localhost:3010/api/v0/login', async () => {
        const name = 'John Doe';
        const accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6Ik
      pXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4
      gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZ
      SI6InVzZXIiLCJpYXQiOjE2OTYzMzg0ODYsImV4cCI6MTY5NjM0
      MjA4Nn0.sGDv3cjJAqXHE6qFW2mEyEd8oSXUvj4zk82XuAiR5lA`;
        return HttpResponse.json({name: name, accessToken: accessToken},
            {status: 200});
      }),
  );
  expect(screen.getAllByText(/email address/i).length).toBeGreaterThan(0);
  expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0);

  // Check for elements with specific aria-labels
  expect(screen.getByLabelText('login-email')).toBeInTheDocument();
  expect(screen.getByLabelText('login-password')).toBeInTheDocument();
  expect(screen.getByLabelText('login-submit')).toBeInTheDocument();
});

it('login failed with wrong credentials', () => {
  render(<App />);
  // Check for login heading
  // Check for email and password fields
  expect(screen.getAllByLabelText(/email address/i).length).toBeGreaterThan(0);
  expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0);
});

it('shows error message with incorrect credentials', async () => {
  // Clear localStorage to ensure we're logged out
  localStorage.clear();

  // Mock the login endpoint to return an error for any credentials
  server.use(
      http.post('http://localhost:3010/api/v0/login', async () => {
        return HttpResponse.json({}, {status: 401});
      }),
  );

  // Also mock the workspaces endpoints to prevent those errors
  server.use(
      http.get('http://localhost:3010/api/v0/workspaces', () => {
        return HttpResponse.json([]);
      }),
      http.get('http://localhost:3010/api/v0/workspaces/current', () => {
        return HttpResponse.json({}, {status: 404});
      }),
  );

  render(<App />);

  // Get the actual input elements within the containers
  const emailContainer = screen.getByLabelText('login-email');
  const passwordContainer = screen.getByLabelText('login-password');
  const submitButton = screen.getByLabelText('login-submit');

  // Find the input elements inside the containers
  const emailInput = emailContainer.querySelector('input');
  const passwordInput = passwordContainer.querySelector('input');

  // Fill in the form with incorrect credentials
  fireEvent.change(emailInput, {target: {value: 'wrong@example.com'}});
  fireEvent.change(passwordInput, {target: {value: 'wrongpassword'}});

  // Submit the form
  fireEvent.click(submitButton);

  // Wait for the error message to appear
  const errorMessage = await waitFor(() =>
    screen.getByText(/Login failed. Please check your credentials./i),
  );
  //   console.log('errorMessage', errorMessage);

  // Verify the error message is displayed
  expect(errorMessage).toBeInTheDocument();

  // Verify the token was not stored in localStorage
  expect(localStorage.getItem('token')).toBeNull();
});

// it('successfully logs in with correct credentials', async () => {
//   // Mock the login endpoint
//   server.use(
//       http.post('http://localhost:3010/api/v0/login', async ({request}) => {
//         const requestBody = await request.json();

//         // Check if credentials match what we expect
//         if (requestBody.email === 'anna@books.com' &&
//           requestBody.password === 'annaadmin') {
//           return HttpResponse.json({
//             name: 'Anna',
//             id: '123456',
//             accessToken: 'mock-token-for-anna',
//           }, {status: 200});
//         } else {
//           return HttpResponse.json({
//             message: 'Invalid credentials',
//           }, {status: 401});
//         }
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces', () => {
//         return HttpResponse.json([
//           {
//             id: 'workspace-1',
//             name: 'CSE 186',
//             role: 'admin',
//             current: 'true',
//           },
//           {
//             id: 'workspace-2',
//             name: 'CSE 101',
//             role: 'member',
//             current: 'false',
//           },
//         ]);
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces/current', () => {
//         return HttpResponse.json({
//           currentWorkspace: 'workspace-1',
//         });
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces/workspace-1/channels', () => {
//         return HttpResponse.json([
//           {
//             id: 'channel-1',
//             name: 'General',
//           },
//           {
//             id: 'channel-2',
//             name: 'Announcements',
//           },
//         ]);
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces/workspace-1/users', () => {
//         return HttpResponse.json([
//           {
//             id: '123456',
//             name: 'Anna',
//             online: true,
//           },
//           {
//             id: '789012',
//             name: 'Bob',
//             online: false,
//           },
//         ]);
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces', () => {
//         return HttpResponse.json([]);
//       }),
//       http.get('http://localhost:3010/api/v0/workspaces/current', () => {
//         return HttpResponse.json({}, {status: 404});
//       }),
//   );

//   render(<App />);

//   // Get the actual input elements within the containers
//   const emailContainer = screen.getByLabelText('login-email');
//   const passwordContainer = screen.getByLabelText('login-password');
//   const submitButton = screen.getByLabelText('login-submit');

//   // Find the input elements inside the containers
//   const emailInput = emailContainer.querySelector('input');
//   const passwordInput = passwordContainer.querySelector('input');

//   // Fill in the form
//   fireEvent.change(emailInput, {target: {value: 'anna@books.com'}});
//   fireEvent.change(passwordInput, {target: {value: 'annaadmin'}});

//   // Submit the form
//   fireEvent.click(submitButton);

//   // Wait for the login process to complete
//   await waitFor(() => {
//     // Check if token was stored in localStorage
//     expect(localStorage.getItem('token')).toBe('mock-token-for-anna');
//   });
// });
