import {useEffect} from 'react';
import {Container} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import Header from './Header';
import Channels from './Channels';
import MessageArea from './messaging/MessageArea';
import {useWorkspace} from '../context/WorkspaceContext';

/**
 * Dashboard component shown after successful login
 * @returns {object} Dashboard UI
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    setCurrentUser,
    selectedChannelData,
    selectedDMData,
    viewingMessages,
    setViewingMessages,
  } = useWorkspace();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('id');
    setCurrentUser(userId);
    if (!token) {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate, setCurrentUser]);

  // Handler for going back to channel list
  const handleBackToChannels = () => {
    setViewingMessages(false);
  };

  // For mobile - show message area when viewing messages
  if (viewingMessages && (selectedChannelData || selectedDMData)) {
    console.log('Dashboard render - Channel data:', selectedChannelData);
    console.log('Dashboard render - DM data:', selectedDMData);
    return (
      <>
        <MessageArea
          channelId={selectedChannelData?.id || null}
          channelName={selectedChannelData?.name || null}
          dmId={selectedDMData?.id || null}
          dmName={selectedDMData?.name || null}
          onBack={handleBackToChannels}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="md">
        <Channels />
      </Container>
    </>
  );
}
