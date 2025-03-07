import {it, expect, beforeAll, afterAll, afterEach} from 'vitest';
// expect,
import {setupServer} from 'msw/node';
import {render, screen} from '@testing-library/react';
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
//   // Check for login button
//   expect(screen.getByRole('button', {name: /sign in/i})).toBeInTheDocument();
});

// need to create a test that validates the login for a random person
