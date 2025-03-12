import {it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from 'vitest';
import {setupServer} from 'msw/node';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {http, HttpResponse} from 'msw';
import App from '../App';

// Create a server with properly configured handlers
const server = setupServer();

// Add this at the top level, after imports
let originalFetch;

// Setup and teardown
beforeAll(() => {
  // Add our specific handlers
  server.use(
      // Handler for GET /workspaces/current that specifically c
      http.get('http://localhost:3010/api/v0/workspaces/current', ({request}) => {
      // Get the authorization header from the request
        const authHeader = request.headers.get('Authorization');
        console.log('Auth header found:', authHeader);

        // Always return a successful response regardless of the header
        return HttpResponse.json({
          currentWorkspace: 'workspace-1',
          name: 'CSE 186',
        });
      }),

      // Handler for PUT /workspaces/current
      http.put('http://localhost:3010/api/v0/workspaces/current', () => {
        return HttpResponse.json({
          message: 'Current workspace updated successfully',
        });
      }),
  );

  // Start the server with bypass mode
  server.listen({onUnhandledRequest: 'bypass'});

  // Save the original fetch and patch it
  originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    if (url.includes('/workspaces/current')) {
    //   console.log('Intercepting fetch for:', url);

      // Handle different methods
      if (options?.method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () =>
            ({message: 'Current workspace updated successfully'}),
        };
      } else {
        return {
          ok: true,
          status: 200,
          json: async () =>
            ({currentWorkspace: 'workspace-1', name: 'CSE 186'}),
        };
      }
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

// Helper function to perform login before tests
/**
 *
 */
async function loginSetup() {
  // Mock the login endpoint
  server.use(
      http.post('http://localhost:3010/api/v0/login', async () => {
        return HttpResponse.json({
          name: 'Anna',
          id: '123456',
          accessToken: 'mock-token-for-anna',
        }, {status: 200});
      }),
      // Mock workspace endpoints to prevent errors
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
      // 'http://localhost:3010/api/v0/workspaces/current'
      http.get('http://localhost:3010/api/v0/workspaces/current', () => {
        return new Response(
            JSON.stringify({
              currentWorkspace: 'workspace-1',
            }),
            {status: 200, headers: {'Content-Type': 'application/json'}},
        );
      }),
      http.get('http://localhost:3010/api/v0/workspaces/workspace-1/channels', () => {
        return HttpResponse.json([
          {
            id: 'channel-1',
            name: 'General',
          },
          {
            id: 'channel-2',
            name: 'Announcements',
          },
        ]);
      }),
      http.get('http://localhost:3010/api/v0/workspaces/workspace-1/users', () => {
        return HttpResponse.json([
          {
            id: '123456',
            name: 'Anna',
            online: true,
          },
          {
            id: '789012',
            name: 'Bob',
            online: false,
          },
        ]);
      }),
      http.put('http://localhost:3010/api/v0/workspaces/current', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
              message: 'Current workspace updated successfully',
            }),
        );
      }),
  );

  // Render the app
  render(<App />);

  // Get login form elements
  const emailInput = screen.getByLabelText('login-email')
      .querySelector('input');
  const passwordInput = screen.getByLabelText('login-password')
      .querySelector('input');
  const submitButton = screen.getByLabelText('login-submit');

  // Fill and submit login form
  fireEvent.change(emailInput, {target: {value: 'anna@books.com'}});
  fireEvent.change(passwordInput, {target: {value: 'annaadmin'}});
  fireEvent.click(submitButton);

  // Wait for login to complete and dashboard to load
  await waitFor(() => {
    expect(localStorage.getItem('token')).toBe('mock-token-for-anna');
  });

  // Wait for header to be visible
  await waitFor(() => {
    expect(screen.getByText('CSE 186')).toBeInTheDocument();
  });
}

// Run login setup before each test
beforeEach(async () => {
  await loginSetup();
});

// Test case
it('displays the current workspace name in header', async () => {
  // Find the workspace dropdown button
  const workspaceButton = screen.getByRole('button', {name: /workspace-menu/i});

  // Verify it shows CSE 186
  expect(screen.getByText('CSE 186')).toBeInTheDocument();

  // Click to open the menu
  fireEvent.click(workspaceButton);

  // Verify workspace names appear in the menu
  await waitFor(() => {
    expect(screen.getByText('CSE 101')).toBeInTheDocument();
  });

  // Click to close the menu again
  fireEvent.click(workspaceButton);

  // Verify the menu is after clicking
  expect(workspaceButton).not.toHaveAttribute('aria-expanded');

  // Click to open the menu again
  fireEvent.click(workspaceButton);

  // Click on a workspace item
  const workspaceItem = screen.getByLabelText('View workspace: CSE 101');
  fireEvent.click(workspaceItem);

  // Verify the menu is closed
  expect(workspaceButton).not.toHaveAttribute('aria-expanded');
});

// Create a separate describe block with its own setup for the 404 test
// describe('Header with no current workspace', () => {
//   // Custom setup and teardown for this test suite
//   beforeEach(() => {
//     // Skip the main loginSetup
//     localStorage.clear();
//     localStorage.setItem('token', 'mock-token-for-test');

//     // Clean handlers and set up new ones
//     server.resetHandlers();
//     server.use(
//         // Workspace list still needed
//         http.get('http://localhost:3010/api/v0/workspaces', () => {
//           return HttpResponse.json([
//             {
//               id: 'workspace-1',
//               name: 'CSE 186',
//               role: 'admin',
//               current: 'true',
//             },
//             {
//               id: 'workspace-2',
//               name: 'CSE 101',
//               role: 'member',
//               current: 'false',
//             },
//           ]);
//         }),

//         // Return 404 for current workspace
//         http.get('http://localhost:3010/api/v0/workspaces/current', () => {
//           return new Response(
//               JSON.stringify({message: 'No current workspace found'}),
//               {status: 404},
//           );
//         }),

//         // Empty responses for these since we won't use them in this test
//         http.get('http://localhost:3010/api/v0/workspaces/workspace-1/channels',
//             () => {
//               return HttpResponse.json([]);
//             }),

//         http.get('http://localhost:3010/api/v0/workspaces/workspace-1/users',
//             () => {
//               return HttpResponse.json([]);
//             }),
//     );
//   });

//   // Test for the 404 case
//   it('displays "Select a Workspace" when no workspace exists', async () => {
//     // Render the App component directly
//     const {unmount} = render(<App />);

//     // Wait for Header to render and show "Select a Workspace"
//     await waitFor(() => {
//       expect(screen.getByText('Select a Workspace')).toBeInTheDocument();
//     });

//     // Find and click the workspace dropdown button
//     const workspaceButton = screen
//         .getByRole('button', {name: /workspace-menu/i});
//     fireEvent.click(workspaceButton);

//     // Verify workspaces still appear in the menu
//     await waitFor(() => {
//       expect(screen.getByText('CSE 186')).toBeInTheDocument();
//       expect(screen.getByText('CSE 101')).toBeInTheDocument();
//     });

//     // Clean up
//     unmount();
//   });
// });

// // Add more tests here...
