import {
  it,
  expect,
  describe,
  beforeEach,
  vi,
} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import Footer from '../components/footer';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock functions
const mockNavigate = vi.fn();
const mockSetViewingMessages = vi.fn();

// Mock the WorkspaceContext
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    setViewingMessages: mockSetViewingMessages,
  }),
  WorkspaceProvider: ({children}) => children,
}));

describe('Footer Component', () => {
  beforeEach(() => {
    // Clear mocks between tests
    vi.clearAllMocks();
  });

  it('renders correctly with channels view active', () => {
    render(<Footer showingChannels={true} />);

    // Check that both buttons are present
    const homeButton = screen.getByLabelText('go home');
    const logoutButton = screen.getByLabelText('logout');

    expect(homeButton).toBeInTheDocument();
    expect(logoutButton).toBeInTheDocument();

    // Home button should be disabled when showing channels
    expect(homeButton).toBeDisabled();
  });

  it('renders correctly with messages view active', () => {
    render(<Footer showingChannels={false} />);

    const homeButton = screen.getByLabelText('go home');
    const logoutButton = screen.getByLabelText('logout');

    expect(homeButton).toBeInTheDocument();
    expect(logoutButton).toBeInTheDocument();

    // Home button should be enabled when not showing channels
    expect(homeButton).not.toBeDisabled();
  });

  it('calls setViewingMessages when home button is clicked', () => {
    render(<Footer showingChannels={false} />);

    const homeButton = screen.getByLabelText('go home');
    fireEvent.click(homeButton);

    // Should call setViewingMessages with false
    expect(mockSetViewingMessages).toHaveBeenCalledWith(false);
  });

  it('handles logout correctly', () => {
    // Mock localStorage
    const localStorageMock = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    render(<Footer showingChannels={true} />);

    const logoutButton = screen.getByLabelText('logout');
    fireEvent.click(logoutButton);

    // Should clear localStorage items
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('name');

    // Should navigate to login page
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
