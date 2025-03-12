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

  // Save the original fetch
  originalFetch = window.fetch;
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
          },
        ]);
      }),

      // Current workspace
      http.get('http://localhost:3010/api/v0/workspaces/current', () => {
        return HttpResponse.json({
          currentWorkspace: 'workspace-1',
        });
      }),

      // Mock channels for the workspace
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

      // Mock users for direct messages
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

// Test case for collapsing and expanding sections
it('can collapse and expand Channels and DMs', async () => {
  // Render the App with our mocks
  render(<App />);

  // First perform login
  const emailInput = screen
      .getByLabelText('login-email').querySelector('input');
  const passwordInput = screen
      .getByLabelText('login-password').querySelector('input');
  const submitButton = screen
      .getByLabelText('login-submit');

  // Fill login form
  fireEvent.change(emailInput, {target: {value: 'anna@books.com'}});
  fireEvent.change(passwordInput, {target: {value: 'annaadmin'}});
  fireEvent.click(submitButton);

  // Wait for login to complete
  await waitFor(() => {
    expect(localStorage.getItem('token')).toBe('mock-token-for-anna');
  });

  // Wait for the channels to load - verify "General" channel is visible
  await waitFor(() => {
    expect(screen.getByText('# General')).toBeInTheDocument();
  });

  // Verify Direct Messages section is also visible initially
  expect(screen.getByText('Bob')).toBeInTheDocument();

  // Find the "Channels" header section to click
  const channelsHeader = screen
      .getByText('Channels')
      .closest('div');

  // Click to collapse the Channels section
  fireEvent.click(channelsHeader);

  // Verify the channels are no longer visible
  await waitFor(() => {
    expect(screen.queryByText('# General')).not.toBeInTheDocument();
  });

  // Click again to expand the Channels section
  fireEvent.click(channelsHeader);

  // Verify the channels are visible again
  await waitFor(() => {
    expect(screen.getByText('# General')).toBeInTheDocument();
  });

  // Find the "Direct Messages" header section to click
  const dmHeader = screen
      .getByText('Direct Messages')
      .closest('div');

  // Click to collapse the Direct Messages section
  fireEvent.click(dmHeader);

  // Verify the direct messages are no longer visible
  await waitFor(() => {
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  // Click again to expand the Direct Messages section
  fireEvent.click(dmHeader);

  // Verify the direct messages are visible again
  await waitFor(() => {
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  // Now test clicking on a channel
  const generalChannel = screen.getByText('# General');
  fireEvent.click(generalChannel);

  // Verify the channel is selected (the styling includes bold text)
  await waitFor(() => {
    // Check if the text is bold (Material-UI uses 700 for bold)
    expect(generalChannel).toHaveStyle('font-weight: 700');
  });

  // Now test clicking on a direct message
  const bobDM = screen.getByText('Bob');
  fireEvent.click(bobDM);

  // Verify the DM is selected (again checking for bold text)
  await waitFor(() => {
    expect(bobDM).toHaveStyle('font-weight: 700');
  });

  //   // Click on a different channel to verify that selection changes
  //   const announcementsChannel = screen.getByText('# Announcements');
  //   fireEvent.click(announcementsChannel);

  //   // Verify the new channel has bold text
  //   await waitFor(() => {
  //     expect(announcementsChannel).toHaveStyle('font-weight: 700');
  //   });

  //   // The first channel should no longer have bold text
  //   await waitFor(() => {
  //     expect(generalChannel).not.toHaveStyle('font-weight: 700');
  //   });

  //   // Click on the "Add Channel" button to verify it's responsive
  //   const addChannelButton = screen.getByText('Add Channel');
  //   expect(addChannelButton).toBeInTheDocument();

//   // Click on the "Add Teammate" button to verify it's responsive
//   const addTeammateButton = screen.getByText('Add Teammate');
//   expect(addTeammateButton).toBeInTheDocument();
});
