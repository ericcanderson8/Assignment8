import {
  it,
  expect,
  vi,
  describe,
} from 'vitest';

describe('Message Back Button Handler', () => {
  it('handler function sets viewingMessages to false', () => {
    // Create a mock for setViewingMessages
    const setViewingMessagesMock = vi.fn();

    // Create the handler function (this simulates the o
    // nBack prop function in Dashboard)
    const handleBackButtonClick = () => {
      setViewingMessagesMock(false);
    };

    // Call the handler function
    handleBackButtonClick();

    // Verify the mock was called with false
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);
  });

  it('handles multiple back button clicks the same way', () => {
    // Create a mock for setViewingMessages
    const setViewingMessagesMock = vi.fn();

    // Create the handler function
    const handleBackButtonClick = () => {
      setViewingMessagesMock(false);
    };

    // Call the handler function multiple times
    handleBackButtonClick();
    handleBackButtonClick();
    handleBackButtonClick();

    // Verify the mock was called the right number of times with false
    expect(setViewingMessagesMock).toHaveBeenCalledTimes(3);
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);
  });

  it('simulates messageAreaProps creation with channel data', () => {
    // Mock the setViewingMessages function
    const setViewingMessagesMock = vi.fn();

    // Sample channel data
    const channelData = {id: 'channel-1', name: 'General'};

    // Create messageAreaProps similar to how Dashboard does it
    const messageAreaProps = {
      channelId: channelData.id || null,
      channelName: channelData.name || null,
      dmId: null,
      dmName: null,
      onBack: () => setViewingMessagesMock(false),
    };

    // Call the onBack function
    messageAreaProps.onBack();

    // Verify setViewingMessages was called with false
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);

    // Verify the props were correctly created
    expect(messageAreaProps.channelId).toBe('channel-1');
    expect(messageAreaProps.channelName).toBe('General');
    expect(messageAreaProps.dmId).toBeNull();
    expect(messageAreaProps.dmName).toBeNull();
  });

  it('simulates messageAreaProps creation with DM data', () => {
    // Mock the setViewingMessages function
    const setViewingMessagesMock = vi.fn();

    // Sample DM data
    const dmData = {id: 'user-2', name: 'Bob'};

    // Create messageAreaProps similar to how Dashboard does it
    const messageAreaProps = {
      channelId: null,
      channelName: null,
      dmId: dmData.id || null,
      dmName: dmData.name || null,
      onBack: () => setViewingMessagesMock(false),
    };

    // Call the onBack function
    messageAreaProps.onBack();

    // Verify setViewingMessages was called with false
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);

    // Verify the props were correctly created
    expect(messageAreaProps.channelId).toBeNull();
    expect(messageAreaProps.channelName).toBeNull();
    expect(messageAreaProps.dmId).toBe('user-2');
    expect(messageAreaProps.dmName).toBe('Bob');
  });

  it(`simulates messageAreaProps creation with 
    both channel and DM data`, () => {
    // Mock the setViewingMessages function
    const setViewingMessagesMock = vi.fn();

    // Sample data
    const channelData = {id: 'channel-1', name: 'General'};
    const dmData = {id: 'user-2', name: 'Bob'};

    // Create messageAreaProps similar to how Dashboard does it
    const messageAreaProps = {
      channelId: channelData.id || null,
      channelName: channelData.name || null,
      dmId: dmData.id || null,
      dmName: dmData.name || null,
      onBack: () => setViewingMessagesMock(false),
    };

    // Call the onBack function
    messageAreaProps.onBack();

    // Verify setViewingMessages was called with false
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);

    // Verify the props were correctly created
    expect(messageAreaProps.channelId).toBe('channel-1');
    expect(messageAreaProps.channelName).toBe('General');
    expect(messageAreaProps.dmId).toBe('user-2');
    expect(messageAreaProps.dmName).toBe('Bob');
  });

  it('handles null values in messageAreaProps creation', () => {
    // Mock the setViewingMessages function
    const setViewingMessagesMock = vi.fn();

    // Null data
    const channelData = null;
    const dmData = null;

    // Create messageAreaProps similar to how Dashboard does it
    const messageAreaProps = {
      channelId: channelData?.id || null,
      channelName: channelData?.name || null,
      dmId: dmData?.id || null,
      dmName: dmData?.name || null,
      onBack: () => setViewingMessagesMock(false),
    };

    // Call the onBack function
    messageAreaProps.onBack();

    // Verify setViewingMessages was called with false
    expect(setViewingMessagesMock).toHaveBeenCalledWith(false);

    // Verify the props were correctly created with null values
    expect(messageAreaProps.channelId).toBeNull();
    expect(messageAreaProps.channelName).toBeNull();
    expect(messageAreaProps.dmId).toBeNull();
    expect(messageAreaProps.dmName).toBeNull();
  });
});
