import {useState, useEffect} from 'react';
import {Box, Typography, Paper, Divider, IconButton} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PropTypes from 'prop-types';

/**
 * MessageArea component for displaying and sending messages
 * @param {object} props - Component props
 * @param {string} props.channelId - ID of the selected channel
 * @param {string} props.channelName - Name of the selected channel
 * @param {string} props.dmId - ID of the selected DM
 * @param {string} props.dmName - Name of the selected DM
 * @param {object} props.onBack - Callback for when back button is clicked
 * @returns {object} MessageArea component
 */
export default function MessageArea({
  channelId,
  channelName,
  dmId,
  dmName,
  onBack,
}) {
  const [messages, setMessages] = useState([]);

  // Hardcoded data for demonstration
  useEffect(() => {
    // Different messages depending on whether it's a channel or DM
    if (channelId) {
      setMessages([
        {
          id: '1',
          content: 'Hello everyone! Welcome to the channel.',
          sender: 'Anna',
          timestamp: '2023-05-15T10:30:00',
          userId: '123456',
        },
        {
          id: '2',
          content: 'Thanks for creating this channel. I think it will be ' +
            'very useful.',
          sender: 'Bob',
          timestamp: '2023-05-15T10:35:00',
          userId: '789012',
        },
        {
          id: '3',
          content: 'I agree! Let\'s start planning our project here.',
          sender: 'Charlie',
          timestamp: '2023-05-15T10:40:00',
          userId: '345678',
        },
        {
          id: '4',
          content: 'Has anyone started working on the UI designs?',
          sender: 'Anna',
          timestamp: '2023-05-15T11:15:00',
          userId: '123456',
        },
      ]);
    } else if (dmId) {
      setMessages([
        {
          id: '1',
          content: 'Hey, how are you doing?',
          sender: 'You',
          timestamp: '2023-05-15T09:30:00',
          userId: '123456',
        },
        {
          id: '2',
          content: 'I\'m good, thanks! How about you?',
          sender: dmName,
          timestamp: '2023-05-15T09:32:00',
          userId: dmId,
        },
        {
          id: '3',
          content: 'Great! Did you get a chance to look at the project I sent?',
          sender: 'You',
          timestamp: '2023-05-15T09:35:00',
          userId: '123456',
        },
        {
          id: '4',
          content: 'Yes, I did. It looks promising. Let\'s discuss it ' +
            'tomorrow.',
          sender: dmName,
          timestamp: '2023-05-15T09:40:00',
          userId: dmId,
        },
      ]);
    }
  }, [channelId, dmId, dmName]);

  /**
   * Handle sending a new message
   * @param {string} content - Message content
   */
  const handleSendMessage = (content) => {
    const newMessage = {
      id: `${Date.now()}`,
      content,
      sender: 'You',
      timestamp: new Date().toISOString(),
      userId: '123456', // Hardcoded current user ID
    };

    setMessages([...messages, newMessage]);
  };

  // Determine if we're in a channel or DM
  const isChannel = Boolean(channelId);
  const title = isChannel ? `# ${channelName}` : dmName;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        backgroundColor: '#f8f8f8',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          edge="start"
          aria-label="back"
          onClick={onBack}
          sx={{mr: 1}}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        {isChannel && (
          <Typography variant="body2" color="text.secondary">
            Channel description could go here
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Message List */}
      <Box sx={{flexGrow: 1, overflow: 'auto', p: 2}}>
        <MessageList messages={messages} />
      </Box>

      {/* Message Input */}
      <Box sx={{p: 2, backgroundColor: '#fff'}}>
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${title}`}
        />
      </Box>
    </Paper>
  );
}

MessageArea.propTypes = {
  channelId: PropTypes.string,
  channelName: PropTypes.string,
  dmId: PropTypes.string,
  dmName: PropTypes.string,
  onBack: PropTypes.func.isRequired,
};
