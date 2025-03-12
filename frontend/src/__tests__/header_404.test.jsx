import {
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {setupServer} from 'msw/node';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {http, HttpResponse} from 'msw';
import App from '../App';

// Create a server with properly configured handlers
const server = setupServer();

let originalFetch;

// Setup and teardown
beforeAll(() => {
  // Start the server with bypass mode
  server.listen({onUnhandledRequest: 'bypass'});

  // Save the original fetch and patch it
  originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    if (url.includes('/workspaces/current')) {
      // Return 404 for current workspace
      return {
        ok: false,
        status: 404,
        json: async () => ({message: 'No current workspace found'}),
      };
    }

    // For all other requests, try the original fetch
    try {
      return await originalFetch(url, options);
    } catch (error) {
      // If it fails, provide a mock response
      console.warn(`Fetch error for ${url}:`, error.message);
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    }
  };
});

beforeEach(() => {
  // Clean up and reset
  localStorage.clear();

  // Mock handlers
  server.use(
      // Login endpoint
      http.post('http://localhost:3010/api/v0/login', async () => {
        return HttpResponse.json({
          name: 'Anna',
          id: '123456',
          accessToken: 'mock-token-for-anna',
        }, {status: 200});
      }),

      // Workspace list endpoint
      http.get('http://localhost:3010/api/v0/workspaces', () => {
        return HttpResponse.json([
          {
            id: 'workspace-1',
            name: 'CSE 186',
            role: 'admin',
            current: 'true',
          },
          {
            id: 'workspace-2',
            name: 'CSE 101',
            role: 'member',
            current: 'false',
          },
        ]);
      }),

      // Return 404 for current workspace
      http.get('http://localhost:3010/api/v0/workspaces/current', () => {
        return new Response(
            JSON.stringify({message: 'No current workspace found'}),
            {status: 404},
        );
      }),

      // Empty responses for channels and users
      http.get('**/**/channels', () => {
        return HttpResponse.json([]);
      }),

      http.get('**/**/users', () => {
        return HttpResponse.json([]);
      }),
  );
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
  // Restore the original fetch
  if (typeof window !== 'undefined') {
    window.fetch = originalFetch;
  }
});

// Test case for the 404 response
it('displays "Select a Workspace" with no current workspace', async () => {
  // Render the App with our mocks
  render(<App />);

  // First perform login
  const emailInput =
    screen.getByLabelText('login-email').querySelector('input');
  const passwordInput =
   screen.getByLabelText('login-password').querySelector('input');
  const submitButton =
   screen.getByLabelText('login-submit');

  // Fill login form
  fireEvent.change(emailInput, {target: {value: 'anna@books.com'}});
  fireEvent.change(passwordInput, {target: {value: 'annaadmin'}});
  fireEvent.click(submitButton);

  // Wait for login to complete and token to be set
  await waitFor(() => {
    expect(localStorage.getItem('token')).toBe('mock-token-for-anna');
  });

  // Now wait for the Header to render with "Select a Workspace"
  await waitFor(() => {
    expect(screen.getByText('Select a Workspace')).toBeInTheDocument();
  });

  // Find and click the workspace dropdown button
  const workspaceButton = screen.getByRole('button', {name: /workspace-menu/i});
  fireEvent.click(workspaceButton);

  // Verify workspaces appear in the menu
  await waitFor(() => {
    expect(screen.getByText('CSE 186')).toBeInTheDocument();
    expect(screen.getByText('CSE 101')).toBeInTheDocument();
  });
});
