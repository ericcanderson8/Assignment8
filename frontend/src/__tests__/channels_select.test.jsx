import {
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
  describe,
} from 'vitest';
import {setupServer} from 'msw/node';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {http, HttpResponse} from 'msw';
import WorkspaceContext, {WorkspaceProvider} from '../context/WorkspaceContext';
import Channels from '../components/Channels';
import {BrowserRouter} from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import PropTypes from 'prop-types';

// Create a server with properly configured handlers
const server = setupServer();

let originalFetch;

// Sample data for channels and users
const channels = [
  {
    id: 'channel-1',
    name: 'General',
  },
  {
    id: 'channel-2',
    name: 'Announcements',
  },
];

const users = [
  {
    id: 'user-1',
    name: 'Anna',
    online: true,
  },
  {
    id: 'user-2',
    name: 'Bob',
    online: false,
  },
];

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
          id: 'user-1',
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
        return HttpResponse.json(channels);
      }),

      // Mock users for direct messages
      http.get('http://localhost:3010/api/v0/workspaces/workspace-1/users', () => {
        return HttpResponse.json(users);
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

describe('Channel and DM selection', () => {
  it('can select a channel and clear DM selection', async () => {
    // Mock the WorkspaceContext functions
    const setSelectedChannelMock = vi.fn();
    const setSelectedChannelDataMock = vi.fn();
    const setSelectedDMMock = vi.fn();
    const setSelectedDMDataMock = vi.fn();
    const setViewingMessagesMock = vi.fn();

    // Create a custom wrapper to provide context
    const Wrapper = ({children}) => {
      return (
        <WorkspaceContext.Provider
          value={{
            currentWorkspace: 'workspace-1',
            currentUser: 'user-1',
            selectedChannel: null,
            setSelectedChannel: setSelectedChannelMock,
            selectedDM: 'user-2', // Initially selected DM
            setSelectedDM: setSelectedDMMock,
            setViewingMessages: setViewingMessagesMock,
            setSelectedChannelData: setSelectedChannelDataMock,
            setSelectedDMData: setSelectedDMDataMock,
          }}
        >
          {children}
        </WorkspaceContext.Provider>
      );
    };
    Wrapper.propTypes = {
      children: PropTypes.node.isRequired,
    };

    // Render the Channels component with our mock context
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(<Channels />, {wrapper: Wrapper});

    // Wait for channels to load
    await waitFor(() => {
      expect(screen.getByText('# General')).toBeInTheDocument();
    });

    // Click on a channel
    const generalChannel = screen.getByText('# General');
    fireEvent.click(generalChannel);

    // Verify that the correct functions were called
    expect(setSelectedChannelMock).toHaveBeenCalledWith('channel-1');
    expect(setSelectedChannelDataMock)
        .toHaveBeenCalledWith(expect.objectContaining({
          id: 'channel-1',
          name: 'General',
        }));
    expect(setSelectedDMMock).toHaveBeenCalledWith(null);
    expect(setSelectedDMDataMock).toHaveBeenCalledWith(null);
    expect(setViewingMessagesMock).toHaveBeenCalledWith(true);
  });

  it('can select a DM and clear channel selection', async () => {
    // Mock the WorkspaceContext functions
    const setSelectedChannelMock = vi.fn();
    const setSelectedChannelDataMock = vi.fn();
    const setSelectedDMMock = vi.fn();
    const setSelectedDMDataMock = vi.fn();
    const setViewingMessagesMock = vi.fn();

    // Create a custom wrapper to provide context
    const Wrapper = ({children}) => {
      return (
        <WorkspaceContext.Provider
          value={{
            currentWorkspace: 'workspace-1',
            currentUser: 'user-1',
            selectedChannel: 'channel-1', // Initially selected channel
            setSelectedChannel: setSelectedChannelMock,
            selectedDM: null,
            setSelectedDM: setSelectedDMMock,
            setViewingMessages: setViewingMessagesMock,
            setSelectedChannelData: setSelectedChannelDataMock,
            setSelectedDMData: setSelectedDMDataMock,
          }}
        >
          {children}
        </WorkspaceContext.Provider>
      );
    };
    Wrapper.propTypes = {
      children: PropTypes.node.isRequired,
    };

    // Render the Channels component with our mock context
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(<Channels />, {wrapper: Wrapper});

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Click on a DM
    const bobDM = screen.getByText('Bob');
    fireEvent.click(bobDM);

    // Verify that the correct functions were called
    expect(setSelectedDMMock).toHaveBeenCalledWith('user-2');
    expect(setSelectedDMDataMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-2',
      name: 'Bob',
    }));
    expect(setSelectedChannelMock).toHaveBeenCalledWith(null);
    expect(setSelectedChannelDataMock).toHaveBeenCalledWith(null);
    expect(setViewingMessagesMock).toHaveBeenCalledWith(true);
  });

  it('updates selected channel data when selectedChannel changes', async () => {
    // Mock the WorkspaceContext functions
    const setSelectedChannelDataMock = vi.fn();
    const setSelectedDMMock = vi.fn();
    const setSelectedDMDataMock = vi.fn();

    // Create a custom wrapper to provide context
    const Wrapper = ({children}) => {
      return (
        <WorkspaceContext.Provider
          value={{
            currentWorkspace: 'workspace-1',
            currentUser: 'user-1',
            selectedChannel: 'channel-1',
            setSelectedChannel: vi.fn(),
            selectedDM: null,
            setSelectedDM: setSelectedDMMock,
            setViewingMessages: vi.fn(),
            setSelectedChannelData: setSelectedChannelDataMock,
            setSelectedDMData: setSelectedDMDataMock,
          }}
        >
          {children}
        </WorkspaceContext.Provider>
      );
    };
    Wrapper.propTypes = {
      children: PropTypes.node.isRequired,
    };

    // Render the Channels component with our mock context
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(<Channels />, {wrapper: Wrapper});

    // Wait for channels to load and useEffect to run
    await waitFor(() => {
      expect(screen.getByText('# General')).toBeInTheDocument();
    });

    // Verify the setSelectedChannelData was called with the right data
    await waitFor(() => {
      expect(setSelectedChannelDataMock)
          .toHaveBeenCalledWith(expect.objectContaining({
            id: 'channel-1',
            name: 'General',
          }));
    });
  });

  it('updates selected DM data when selectedDM changes', async () => {
    // Mock the WorkspaceContext functions
    const setSelectedChannelMock = vi.fn();
    const setSelectedChannelDataMock = vi.fn();
    const setSelectedDMDataMock = vi.fn();

    // Create a custom wrapper to provide context
    const Wrapper = ({children}) => {
      return (
        <WorkspaceContext.Provider
          value={{
            currentWorkspace: 'workspace-1',
            currentUser: 'user-1',
            selectedChannel: null,
            setSelectedChannel: setSelectedChannelMock,
            selectedDM: 'user-2',
            setSelectedDM: vi.fn(),
            setViewingMessages: vi.fn(),
            setSelectedChannelData: setSelectedChannelDataMock,
            setSelectedDMData: setSelectedDMDataMock,
          }}
        >
          {children}
        </WorkspaceContext.Provider>
      );
    };
    Wrapper.propTypes = {
      children: PropTypes.node.isRequired,
    };

    // Render the Channels component with our mock context
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(<Channels />, {wrapper: Wrapper});

    // Wait for users to load and useEffect to run
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Verify the setSelectedDMData was called with the right data
    await waitFor(() => {
      expect(setSelectedDMDataMock)
          .toHaveBeenCalledWith(expect.objectContaining({
            id: 'user-2',
            name: 'Bob',
          }));
    });
  });

  it('shows message area when', async () => {
    // Set up mock context with viewingMessages true and channel data
    const setViewingMessagesMock = vi.fn();
    const mockContextValue = {
      setCurrentUser: vi.fn(),
      selectedChannelData: channels[0],
      selectedDMData: null,
      viewingMessages: true,
      setViewingMessages: setViewingMessagesMock,
    };

    // Mock localStorage token
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'id') return 'user-1';
      return null;
    });

    // Render Dashboard component with our mock context
    render(
        <BrowserRouter>
          <WorkspaceProvider value={mockContextValue}>
            <Dashboard />
          </WorkspaceProvider>
        </BrowserRouter>,
    );

    // Other assertions remain the same
    // ... existing code ...
  });
});
