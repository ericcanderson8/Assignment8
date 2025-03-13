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
import MessageArea from '../components/messaging/MessageArea';

// Create a server with properly configured handlers
const server = setupServer();

let originalFetch;

// Sample data for channels and messages
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

// Sample messages for channel
const channelMessages = [
  {
    id: 'msg-1',
    content: 'Hello everyone! Welcome to the channel.',
    sender: 'Anna',
    timestamp: '2023-05-15T10:30:00',
    userId: 'user-1',
  },
  {
    id: 'msg-2',
    content: 'Thanks for creating this channel. It will be very useful.',
    sender: 'Bob',
    timestamp: '2023-05-15T10:35:00',
    userId: 'user-2',
  },
];

// Sample messages for DM
const dmMessages = [
  {
    id: 'dm-1',
    content: 'Hey, how are you doing?',
    sender: 'You',
    timestamp: '2023-05-15T09:30:00',
    userId: 'user-1',
  },
  {
    id: 'dm-2',
    content: 'I\'m good, thanks! How about you?',
    sender: 'Bob',
    timestamp: '2023-05-15T09:32:00',
    userId: 'user-2',
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

      // Mock channel messages endpoint
      http.get('http://localhost:3010/api/v0/channels/channel-1/messages', () => {
        return HttpResponse.json(channelMessages);
      }),

      // Mock DM messages endpoint
      http.get('http://localhost:3010/api/v0/dm/user-2/messages', () => {
        return HttpResponse.json(dmMessages);
      }),

      // Mock send channel message endpoint
      http.post('http://localhost:3010/api/v0/channels/channel-1/messages', async ({request}) => {
        const body = await request.json();
        const newMessage = {
          id: 'new-msg-1',
          content: body.content,
          sender: 'Anna',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
        };
        return HttpResponse.json(newMessage, {status: 201});
      }),

      // Mock send DM message endpoint
      http.post('http://localhost:3010/api/v0/dm/user-2/messages', async ({request}) => {
        const body = await request.json();
        const newMessage = {
          id: 'new-dm-1',
          content: body.content,
          sender: 'You',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
        };
        return HttpResponse.json(newMessage, {status: 201});
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

describe('Messaging functionality', () => {
  it('can view and send channel messages', async () => {
    // Test MessageArea component directly
    const onBackMock = vi.fn();

    // Mock localStorage.getItem for token
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(
        <MessageArea
          channelId="channel-1"
          channelName="General"
          onBack={onBackMock}
        />,
    );

    // Wait for channel messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello everyone! Welcome to the channel.'))
          .toBeInTheDocument();
    });

    // Verify message structure
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(
        'Thanks for creating this channel. It will be very useful.',
    )).toBeInTheDocument();

    // Find the message input using the correct placeholder
    const messageInput = screen.getByPlaceholderText(/Message # General/i);
    expect(messageInput).toBeInTheDocument();

    // Type a new message
    const newMessage = 'This is a test message';
    fireEvent.change(messageInput, {target: {value: newMessage}});

    // Send the message
    const sendButton = screen.getByLabelText('send message');
    fireEvent.click(sendButton);

    // Verify the new message appears
    await waitFor(() => {
      expect(screen.getByText(newMessage)).toBeInTheDocument();
    });
  });

  it('can view and send direct messages', async () => {
    // Test MessageArea component directly
    const onBackMock = vi.fn();

    // Mock localStorage.getItem for token
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(
        <MessageArea
          dmId="user-2"
          dmName="Bob"
          onBack={onBackMock}
        />,
    );

    // Wait for DM messages to load
    await waitFor(() => {
      expect(screen.getByText('Hey, how are you doing?'))
          .toBeInTheDocument();
    });

    // Verify message structure
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('I\'m good, thanks! How about you?'))
        .toBeInTheDocument();

    // Find the message input using the correct placeholder
    const messageInput = screen.getByPlaceholderText(/Message Bob/i);
    expect(messageInput).toBeInTheDocument();

    // Type a new message
    const newMessage = 'I am doing well, thanks for asking!';
    fireEvent.change(messageInput, {target: {value: newMessage}});

    // Send the message
    const sendButton = screen.getByLabelText('send message');
    fireEvent.click(sendButton);

    // Verify the new message appears
    await waitFor(() => {
      expect(screen.getByText(newMessage)).toBeInTheDocument();
    });
  });

  it('has a back button that returns to channel list', async () => {
    // Test MessageArea component directly
    const onBackMock = vi.fn();

    // Mock localStorage.getItem for token
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(
        <MessageArea
          channelId="channel-1"
          channelName="General"
          onBack={onBackMock}
        />,
    );

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello everyone! Welcome to the channel.'))
          .toBeInTheDocument();
    });

    // Verify the back button is present
    const backButton = screen.getByLabelText('back');
    expect(backButton).toBeInTheDocument();

    // Click the back button
    fireEvent.click(backButton);

    // Verify the onBack function was called
    expect(onBackMock).toHaveBeenCalled();
  });

  it('shows empty state correctly', async () => {
    // Override the channel messages endpoint to return empty array
    server.use(
        http.get('http://localhost:3010/api/v0/channels/channel-2/messages', () => {
          return HttpResponse.json([]);
        }),
    );

    // Test MessageArea component directly
    const onBackMock = vi.fn();

    // Mock localStorage.getItem for token
    Storage.prototype.getItem = vi.fn(() => 'mock-token-for-anna');

    render(
        <MessageArea
          channelId="channel-2"
          channelName="Announcements"
          onBack={onBackMock}
        />,
    );

    // Wait for UI to update and verify no messages are shown
    await waitFor(() => {
      expect(screen.queryByText('Hello everyone! Welcome to the channel.'))
          .not.toBeInTheDocument();
    });

    // Verify the message input is still present with the correct placeholder
    const messageInput = screen.getByPlaceholderText(
        /Message # Announcements/i,
    );
    expect(messageInput).toBeInTheDocument();
  });
});
